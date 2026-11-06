using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;
using Microsoft.Web.WebView2.Core;

namespace Stm32Atlas
{
    public partial class MainWindow : Window
    {
        private const string VirtualHost = "stm32.local";
        private bool _isMaximized;

        /* 迷你查询窗 / 全局热键 / 划词监听 */
        private const int WmHotkey = 0x0312;
        private const int HotkeyIdMini = 1;
        private const uint ModAlt = 0x0001;
        private const uint ModControl = 0x0002;
        private const uint ModShift = 0x0004;
        private const uint VkM = 0x4D;
        private const uint VkK = 0x4B;

        /* Ctrl+Alt+M 常被输入法占用（注册返回 1409），按顺序退让 */
        private static readonly (uint Mods, uint Vk, string Label)[] MiniHotkeys =
        {
            (ModControl | ModAlt, VkM, "Ctrl+Alt+M"),
            (ModControl | ModShift, VkM, "Ctrl+Shift+M"),
            (ModControl | ModAlt, VkK, "Ctrl+Alt+K")
        };

        private string _hotkeyLabel = "";

        private const int WhMouseLL = 14;
        private const int WmLButtonDown = 0x0201;
        private const int WmLButtonUp = 0x0202;

        private string _theme = "light";
        private string _lang = "zh";
        private MiniWindow? _mini;
        private bool _mainWasVisible;
        private int _miniSeq;
        private HwndSource? _hwndSource;
        private IntPtr _mouseHook = IntPtr.Zero;
        private LowLevelMouseProc? _mouseProc;
        private POINT _dragStart;
        private long _dragStartTick;
        private bool _dragging;
        private bool _watchOn;

        /* Windows 11 (22000+) 的窗口圆角：交给 DWM 裁，WebView2 的 HWND 也一起被裁 */
        private const int DwmwaWindowCornerPreference = 33;
        private const int DwmwcpDoNotRound = 1;
        private const int DwmwcpRound = 2;

        [DllImport("dwmapi.dll", PreserveSig = true)]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool RegisterHotKey(IntPtr hwnd, int id, uint modifiers, uint vk);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool UnregisterHotKey(IntPtr hwnd, int id);

        [DllImport("user32.dll")] private static extern void keybd_event(byte bVk, byte bScan, uint flags, IntPtr extra);

        [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);

        [DllImport("user32.dll")] private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint threadId);

        [DllImport("user32.dll")] private static extern bool UnhookWindowsHookEx(IntPtr hook);

        [DllImport("user32.dll")] private static extern IntPtr CallNextHookEx(IntPtr hook, int code, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")] private static extern bool GetCursorPos(out POINT pt);

        [DllImport("user32.dll")] private static extern uint GetClipboardSequenceNumber();

        private delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);

        [StructLayout(LayoutKind.Sequential)]
        private struct POINT { public int X; public int Y; }

        public MainWindow()
        {
            InitializeComponent();
            FitToWorkArea();
            Loaded += OnLoaded;
            StateChanged += OnStateChanged;
        }

        private void FitToWorkArea()
        {
            var area = SystemParameters.WorkArea;
            Width = Math.Min(Width, area.Width * 0.94);
            Height = Math.Min(Height, area.Height * 0.94);
            Left = area.Left + (area.Width - Width) / 2;
            Top = area.Top + (area.Height - Height) / 2;
        }

        private async void OnLoaded(object sender, RoutedEventArgs e)
        {
            try
            {
                var dataDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Stm32Atlas", "WebView2");
                Directory.CreateDirectory(dataDir);

                /* 主窗口隐藏（迷你模式）时保持 JS 继续跑，否则查询会卡住 */
                var options = new CoreWebView2EnvironmentOptions(
                    "--disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding");
                var env = await CoreWebView2Environment.CreateAsync(null, dataDir, options);
                await Web.EnsureCoreWebView2Async(env);

                var uiDir = UiAssets.ResolveFolder();
                if (!File.Exists(Path.Combine(uiDir, "index.html")))
                {
                    ShowFallback("找不到界面资源目录：\n" + uiDir);
                    return;
                }

                var core = Web.CoreWebView2;
                core.SetVirtualHostNameToFolderMapping(VirtualHost, uiDir, CoreWebView2HostResourceAccessKind.Allow);
                core.Settings.AreDefaultContextMenusEnabled = false;
                core.Settings.IsStatusBarEnabled = false;
                core.Settings.AreBrowserAcceleratorKeysEnabled = false;
                core.Settings.IsZoomControlEnabled = false;
                core.Settings.IsPinchZoomEnabled = false;
                core.Settings.IsSwipeNavigationEnabled = false;

                core.WebMessageReceived += Core_WebMessageReceived;
                core.Navigate($"https://{VirtualHost}/index.html");
            }
            catch (Exception ex)
            {
                ShowFallback(
                    "需要 Microsoft Edge WebView2 运行时（Windows 10/11 通常已预装）。\n" +
                    "可从 https://go.microsoft.com/fwlink/p/?LinkId=2124703 安装后重试。\n\n" +
                    ex.Message);
            }
        }

        private void Core_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                using var doc = JsonDocument.Parse(e.WebMessageAsJson);
                var root = doc.RootElement;
                if (!root.TryGetProperty("type", out var type)) return;

                if (type.GetString() == "theme")
                {
                    _theme = root.TryGetProperty("value", out var value) ? value.GetString() ?? "light" : "light";
                    if (root.TryGetProperty("lang", out var langEl)) _lang = langEl.GetString() ?? "zh";
                    ApplyHostTheme(_theme);
                    _mini?.ApplyTheme(_theme == "dark");
                    _mini?.ApplyLanguage(_lang);
                    return;
                }
                if (type.GetString() == "mini-result")
                {
                    _mini?.ShowResults(e.WebMessageAsJson);
                    return;
                }
                if (type.GetString() == "selection")
                {
                    if (root.TryGetProperty("text", out var sel)) HandleSelection(sel.GetString());
                    return;
                }
                if (type.GetString() == "mini-open")
                {
                    if (root.TryGetProperty("href", out var hrefEl)) NavigateMain(hrefEl.GetString());
                    return;
                }
                if (type.GetString() == "materials-probe")
                {
                    ReplyMaterialsInfo();
                    return;
                }
                if (type.GetString() == "open-root")
                {
                    var pick = root.TryGetProperty("pick", out var pickEl) && pickEl.ValueKind == JsonValueKind.True;
                    HandleOpenRoot(pick);
                    return;
                }
                if (type.GetString() == "open-path")
                {
                    var rel = root.TryGetProperty("path", out var pathEl) ? pathEl.GetString() : null;
                    HandleOpenPath(rel);
                    return;
                }
                if (type.GetString() != "window") return;
                if (!root.TryGetProperty("action", out var action)) return;

                switch (action.GetString())
                {
                    case "minimize":
                        WindowState = WindowState.Minimized;
                        break;
                    case "maximize":
                        WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
                        break;
                    case "close":
                        Close();
                        break;
                }
            }
            catch
            {
                // ignore malformed messages
            }
        }

        /// <summary>
        /// 网页切换明暗主题时同步标题栏与窗口底色，避免亮色标题栏配深色内容。
        /// </summary>
        private void ApplyHostTheme(string? theme)
        {
            var dark = theme == "dark";
            var res = Application.Current.Resources;

            void Set(string key, string color) =>
                res[key] = new SolidColorBrush((Color)ColorConverter.ConvertFromString(color));

            Set("ShellBg", dark ? "#0F172A" : "#F3F6FB");
            Set("ShellLine", dark ? "#1E2C45" : "#DCE5F1");
            Set("TitleBarBg", dark ? "#0B1120" : "#FFFFFF");
            Set("TitleBarText", dark ? "#E2E8F0" : "#0E1726");
            Set("TitleBadgeBg", dark ? "#132033" : "#EDF3FB");
            Set("TitleBadgeLine", dark ? "#1E3A54" : "#DCE5F1");
            Set("TitleBadgeText", dark ? "#64748B" : "#4E6079");
            Set("TitleIconBrush", dark ? "#94A3B8" : "#475569");
            Set("TitleLogoBrush", dark ? "#22C55E" : "#16A34A");
            Set("WinHoverBg", dark ? "#1E293B" : "#EDF3FB");
            Set("WinHoverText", dark ? "#F8FAFC" : "#0E1726");

            try
            {
                if (Web?.CoreWebView2 != null)
                {
                    Web.DefaultBackgroundColor = dark
                        ? System.Drawing.Color.FromArgb(0x0F, 0x17, 0x2A)
                        : System.Drawing.Color.FromArgb(0xF3, 0xF6, 0xFB);
                }
            }
            catch
            {
                // WebView 还没初始化时忽略，加载完成后网页会再发一次
            }
        }

        private void ShowFallback(string message)
        {
            FallbackText.Text = message;
            Fallback.Visibility = Visibility.Visible;
        }

        private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ClickCount == 2)
            {
                WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;
                return;
            }
            if (e.ButtonState == MouseButtonState.Pressed) DragMove();
        }

        protected override void OnSourceInitialized(EventArgs e)
        {
            base.OnSourceInitialized(e);
            ApplyWindowCorners();

            var handle = new WindowInteropHelper(this).Handle;
            _hwndSource = HwndSource.FromHwnd(handle);
            _hwndSource?.AddHook(WndProc);
            try
            {
                foreach (var (mods, vk, label) in MiniHotkeys)
                {
                    if (!RegisterHotKey(handle, HotkeyIdMini, mods, vk)) continue;
                    _hotkeyLabel = label;
                    MiniButton.ToolTip = "迷你模式（" + label + "）";
                    break;
                }
            }
            catch
            {
                /* 热键被别的程序占了就只保留标题栏按钮 */
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            try
            {
                var handle = new WindowInteropHelper(this).Handle;
                if (handle != IntPtr.Zero) UnregisterHotKey(handle, HotkeyIdMini);
                _hwndSource?.RemoveHook(WndProc);
                UnhookSelectionWatcher();
            }
            catch
            {
                // 退出途中失败无所谓
            }
            base.OnClosed(e);
        }

        private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WmHotkey && wParam.ToInt32() == HotkeyIdMini)
            {
                ToggleMini(null, nearCursor: true);
                handled = true;
            }
            return IntPtr.Zero;
        }

        /* ------------------------------------------------------------------ */
        /* 迷你模式                                                             */
        /* ------------------------------------------------------------------ */

        private void Mini_Click(object sender, RoutedEventArgs e) => ToggleMini();

        private void EnsureMini()
        {
            if (_mini != null) return;

            _mini = new MiniWindow();
            _mini.QueryChanged += OnMiniQuery;
            _mini.OpenRequested += href =>
            {
                NavigateMain(href);
                CloseMini();
            };
            _mini.WatchChanged += SetSelectionWatcher;
            _mini.Closed += (_, _) => { };
            _mini.IsVisibleChanged += (_, _) =>
            {
                if (_mini is { IsVisible: false })
                {
                    /* 隐藏时不卸划词钩子：关掉小窗后继续在别的程序里划词也要能弹出来。
                       卸载只发生在 SetSelectionWatcher(false) 与 OnClosed。 */
                    if (_mainWasVisible) { Show(); Activate(); }
                    _mainWasVisible = false;
                }
            };

            _mini.ApplyTheme(_theme == "dark");
            _mini.ApplyLanguage(_lang);
            _mini.SetHotkeyLabel(_hotkeyLabel);
        }

        private void ToggleMini(string? prefill = null, bool nearCursor = false)
        {
            EnsureMini();
            if (_mini == null) return;

            if (_mini.IsVisible && prefill == null)
            {
                _mini.Hide();
                return;
            }

            var text = prefill ?? CaptureSelection();
            if (_mainWasVisible == false && IsVisible) _mainWasVisible = true;

            _mini.ApplyTheme(_theme == "dark");
            _mini.ApplyLanguage(_lang);
            _mini.Show();
            if (nearCursor) _mini.PlaceNearCursor();
            else _mini.PlaceTopRight();
            _mini.Activate();
            _mini.Prepare(text);

            if (IsVisible) Hide();
        }

        private void CloseMini()
        {
            if (_mini is { IsVisible: true }) _mini.Hide();
        }

        private void OnMiniQuery(string query)
        {
            if (Web?.CoreWebView2 == null) return;
            var payload = JsonSerializer.Serialize(new { type = "mini-query", id = ++_miniSeq, q = query, lang = _lang });
            Web.CoreWebView2.PostWebMessageAsJson(payload);
        }

        private void NavigateMain(string? href)
        {
            if (string.IsNullOrWhiteSpace(href) || Web?.CoreWebView2 == null) return;
            if (!IsVisible) Show();
            if (WindowState == WindowState.Minimized) WindowState = WindowState.Normal;
            Activate();
            var script = "location.hash = " + JsonSerializer.Serialize(href) + ";";
            _ = Web.CoreWebView2.ExecuteScriptAsync(script);
        }

        /// <summary>回报 模块资料 根目录，页面据此显示真实路径。</summary>
        private void ReplyMaterialsInfo()
        {
            var root = MaterialsRoot.Find();
            var payload = JsonSerializer.Serialize(new
            {
                type = "materials-info",
                ok = root != null,
                root = root ?? ""
            });
            Web.CoreWebView2?.PostWebMessageAsJson(payload);
        }

        private void HandleOpenRoot(bool pick)
        {
            var root = pick ? MaterialsRoot.Pick() : MaterialsRoot.Find();
            if (pick && root == null) return;   /* 用户在对话框里取消了 */
            if (root != null) MaterialsRoot.Open(root);

            var payload = JsonSerializer.Serialize(new
            {
                type = "materials-info",
                ok = root != null,
                root = root ?? ""
            });
            Web.CoreWebView2?.PostWebMessageAsJson(payload);
        }

        private void HandleOpenPath(string? relative)
        {
            var ok = MaterialsRoot.TryResolve(relative, out var full) && MaterialsRoot.Open(full);
            if (ok) return;

            var payload = JsonSerializer.Serialize(new { type = "open-result", ok = false });
            Web.CoreWebView2?.PostWebMessageAsJson(payload);
        }

        /// <summary>应用内划词：网页把选中文字发过来，有内容就换成迷你窗查询。</summary>
        private void HandleSelection(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return;
            if (text.Length is < 2 or > 80) return;

            EnsureMini();
            if (_mini == null) return;

            _mini.ApplyTheme(_theme == "dark");
            _mini.ApplyLanguage(_lang);

            if (_mini.IsVisible)
            {
                _mini.Prepare(text);
                OnMiniQuery(text);
                return;
            }

            if (IsVisible) _mainWasVisible = true;
            _mini.Show();
            _mini.PlaceNearCursor();
            _mini.Activate();
            _mini.Prepare(text);
            OnMiniQuery(text);
            if (IsVisible) Hide();
        }

        /// <summary>把当前前台窗口里的选中文字复制过来（Ctrl+C 取词）。</summary>
        private string? CaptureSelection()
        {
            /* 用剪贴板序号判断「这次复制真的写进来了」，而不是比对内容——
               选中词恰好等于剪贴板里的旧内容时，内容比对会误判成「没复制」。 */
            var seq = GetClipboardSequenceNumber();

            SendCopyShortcut();

            var deadline = DateTime.UtcNow.AddMilliseconds(420);
            while (DateTime.UtcNow < deadline)
            {
                System.Threading.Thread.Sleep(30);
                if (GetClipboardSequenceNumber() == seq) continue;
                seq = GetClipboardSequenceNumber();
                try
                {
                    if (!Clipboard.ContainsText()) continue;
                    var text = Clipboard.GetText();
                    if (string.IsNullOrWhiteSpace(text)) continue;
                    text = text.Replace("\r", " ").Replace("\n", " ").Trim();
                    if (text.Length is < 2 or > 80) continue;
                    return text;
                }
                catch
                {
                    // 剪贴板被别的进程占用，继续重试
                }
            }
            return null;
        }

        private static void SendCopyShortcut()
        {
            const byte vkControl = 0x11, vkC = 0x43;
            keybd_event(vkControl, 0, 0, IntPtr.Zero);
            keybd_event(vkC, 0, 0, IntPtr.Zero);
            System.Threading.Thread.Sleep(18);
            keybd_event(vkC, 0, 2, IntPtr.Zero);
            keybd_event(vkControl, 0, 2, IntPtr.Zero);
        }

        /* ------------------------------------------------------------------ */
        /* 划词监听（全局鼠标钩子，默认关闭）                                     */
        /* ------------------------------------------------------------------ */

        private void SetSelectionWatcher(bool on)
        {
            _watchOn = on;
            EnsureMini();
            _mini?.SetWatch(on);
            if (!on) { UnhookSelectionWatcher(); return; }
            if (_mouseHook != IntPtr.Zero) return;

            _mouseProc = MouseHookCallback;
            _mouseHook = SetWindowsHookEx(WhMouseLL, _mouseProc, IntPtr.Zero, 0);
        }

        private void UnhookSelectionWatcher()
        {
            if (_mouseHook == IntPtr.Zero) return;
            UnhookWindowsHookEx(_mouseHook);
            _mouseHook = IntPtr.Zero;
            _mouseProc = null;
        }

        private IntPtr MouseHookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0)
            {
                var msg = wParam.ToInt32();
                if (msg == WmLButtonDown)
                {
                    GetCursorPos(out _dragStart);
                    _dragStartTick = Environment.TickCount64;
                    _dragging = false;
                }
                else if (msg == WmLButtonUp && !_dragging)
                {
                    GetCursorPos(out var end);
                    var dx = end.X - _dragStart.X;
                    var dy = end.Y - _dragStart.Y;
                    var dist = Math.Sqrt(dx * dx + dy * dy);
                    var elapsed = Environment.TickCount64 - _dragStartTick;

                    if (dist >= 8 && elapsed >= 90 && !IsOwnWindowForeground())
                    {
                        _dragging = true;
                        Dispatcher.BeginInvoke(new Action(() =>
                        {
                            _dragging = false;
                            var text = CaptureSelection();
                            if (string.IsNullOrWhiteSpace(text)) return;
                            ToggleMini(text, nearCursor: true);
                        }), DispatcherPriority.Background);
                    }
                }
            }
            return CallNextHookEx(_mouseHook, nCode, wParam, lParam);
        }

        private bool IsOwnWindowForeground()
        {
            var fg = GetForegroundWindow();
            if (fg == IntPtr.Zero) return false;
            GetWindowThreadProcessId(fg, out var pid);
            return pid == (uint)Environment.ProcessId;
        }

        private void ApplyWindowCorners()
        {
            var handle = new WindowInteropHelper(this).Handle;
            if (handle == IntPtr.Zero) return;

            var preference = _isMaximized ? DwmwcpDoNotRound : DwmwcpRound;
            try
            {
                DwmSetWindowAttribute(handle, DwmwaWindowCornerPreference, ref preference, sizeof(int));
            }
            catch
            {
                /* Windows 10 没有这个属性，保持方角即可 */
            }

            if (ShellBorder != null)
            {
                ShellBorder.CornerRadius = _isMaximized ? new CornerRadius(0) : new CornerRadius(10);
                ShellBorder.BorderThickness = _isMaximized ? new Thickness(0) : new Thickness(1);
            }
        }

        private void OnStateChanged(object? sender, EventArgs e)
        {
            _isMaximized = WindowState == WindowState.Maximized;
            ApplyWindowCorners();
            if (MaxIcon != null)
            {
                MaxIcon.Data = Geometry.Parse(_isMaximized
                    ? "M 0,3 H 8 V 11 H 0 Z M 3,3 V 0 H 11 V 8 H 8"
                    : "M 0,0 H 11 V 11 H 0 Z");
            }
        }

        private void Minimize_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;

        private void Maximize_Click(object sender, RoutedEventArgs e) =>
            WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

        private void Close_Click(object sender, RoutedEventArgs e) => Close();
    }
}

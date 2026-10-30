using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;

namespace Stm32Atlas
{
    /// <summary>
    /// 迷你查询窗：无边框、半透明、可置顶。数据仍来自主窗口里的 WebView（宿主转发 JSON），
    /// 这里只做极轻量的 WPF 渲染，因此不占第二个浏览器实例。
    /// </summary>
    public partial class MiniWindow : Window
    {
        private readonly DispatcherTimer _debounce;
        private string _lang = "zh";
        private string _hotkeyLabel = "";
        private bool _watch;
        private bool _loadingSettings;

        public event Action<string>? QueryChanged;
        public event Action<string>? OpenRequested;
        public event Action<bool>? WatchChanged;

        public bool WatchEnabled => _watch;

        public MiniWindow()
        {
            InitializeComponent();
            _debounce = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(150) };
            _debounce.Tick += (_, _) =>
            {
                _debounce.Stop();
                QueryChanged?.Invoke(Query.Text.Trim());
            };

            ApplyTheme(false);
            ApplyLanguage("zh");
            LoadSettings();
            PreviewKeyDown += OnPreviewKeyDown;
            Deactivated += (_, _) => { /* 保留窗口，方便连续查询 */ };
            /* 结果条数变化会让窗口长高，重新钳进可见区域 */
            SizeChanged += (_, _) => ClampToWorkArea();
        }

        /* ------------------------------------------------------------------ */
        /* 主题 / 语言                                                          */
        /* ------------------------------------------------------------------ */

        public void ApplyTheme(bool dark)
        {
            void Set(string key, string color) =>
                Resources[key] = new SolidColorBrush((Color)ColorConverter.ConvertFromString(color));

            Set("MiniBg", dark ? "#F00B1120" : "#F7FFFFFF");
            Set("MiniLine", dark ? "#1E2C45" : "#DCE5F1");
            Set("MiniText", dark ? "#E8EEF9" : "#0E1726");
            Set("MiniMuted", dark ? "#94A6C0" : "#4E6079");
            Set("MiniHover", dark ? "#1E293B" : "#EDF3FB");
            Set("MiniSelect", dark ? "#1C3556" : "#E3EEFB");
            Set("MiniFieldBg", dark ? "#331A2436" : "#80F3F6FB");
            Set("MiniAccent", dark ? "#22C55E" : "#16A34A");
            Set("MiniScrollThumb", dark ? "#2A3B57" : "#C6D3E4");
        }

        public void ApplyLanguage(string lang)
        {
            _lang = lang == "en" ? "en" : "zh";
            HeadText.Text = _lang == "en" ? "Mini lookup" : "迷你查询";
            Query.ToolTip = _lang == "en" ? "Search functions, flows, notes" : "搜索函数、流程、知识点";
            var key = string.IsNullOrEmpty(_hotkeyLabel) ? "" : " · " + _hotkeyLabel;
            Hint.Text = _lang == "en"
                ? "Enter opens the full entry · Esc hides" + key
                : "Enter 打开完整条目 · Esc 收起 · " + _hotkeyLabel + " 呼出";
            TopLabel.Text = _lang == "en" ? "Always on top" : "窗口置顶";
            OpacityLabel.Text = _lang == "en" ? "Opacity" : "不透明度";
            SettingsButton.ToolTip = _lang == "en" ? "Window settings" : "窗口设置";
            UpdateWatchButton();
            if (Results.Items.Count == 0) ShowEmptyState();
        }

        /// <summary>宿主告诉你实际注册到哪个组合键（Ctrl+Alt+M 常被输入法占掉）。</summary>
        public void SetHotkeyLabel(string? label)
        {
            _hotkeyLabel = label ?? "";
            ApplyLanguage(_lang);
        }

        private void UpdateWatchButton()
        {
            WatchButton.Foreground = (Brush)FindResource(_watch ? "MiniAccent" : "MiniMuted");
            WatchButton.ToolTip = _lang == "en"
                ? (_watch ? "Selection watcher: on" : "Selection watcher: off")
                : (_watch ? "划词监听：开" : "划词监听：关");
        }

        public void SetWatch(bool on)
        {
            _watch = on;
            UpdateWatchButton();
        }

        /* ------------------------------------------------------------------ */
        /* 外部调用                                                             */
        /* ------------------------------------------------------------------ */

        public void Prepare(string? prefill)
        {
            if (prefill != null)
            {
                Query.Text = prefill;
                Query.SelectAll();
            }
            Query.Focus();
        }

        public void ShowResults(string json)
        {
            var items = new List<MiniEntry>();
            try
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("items", out var arr) && arr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var el in arr.EnumerateArray())
                    {
                        items.Add(new MiniEntry
                        {
                            Kind = el.TryGetProperty("kind", out var k) ? k.GetString() ?? "" : "",
                            Title = el.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                            Sub = el.TryGetProperty("sub", out var s) ? s.GetString() ?? "" : "",
                            Href = el.TryGetProperty("href", out var h) ? h.GetString() ?? "" : ""
                        });
                    }
                }
            }
            catch
            {
                // 主窗口返回了畸形数据：当作无结果
            }

            Results.ItemsSource = items;
            if (items.Count > 0)
            {
                Results.SelectedIndex = 0;
                Hint.Text = _lang == "en"
                    ? $"{items.Count} item(s) · Enter opens · Esc hides"
                    : $"共 {items.Count} 条 · Enter 打开 · Esc 收起";
            }
            else
            {
                ShowEmptyState();
            }
        }

        private void ShowEmptyState()
        {
            var pick = string.IsNullOrEmpty(_hotkeyLabel) ? "Ctrl+Alt+M" : _hotkeyLabel;
            Hint.Text = string.IsNullOrWhiteSpace(Query.Text)
                ? (_lang == "en"
                    ? "Type a name, or select a word anywhere then press " + pick
                    : "输入函数名/关键词，或在任意程序里选中词后按 " + pick)
                : (_lang == "en" ? "No match." : "没有匹配的条目。");
        }

        /// <summary>把窗口放到鼠标附近，并保证整窗落在光标所在显示器的可见区域内。</summary>
        public void PlaceNearCursor()
        {
            if (!GetCursorPos(out var pt)) return;
            if (!TryMonitorInfo(MonitorFromPoint(pt, MonitorDefaultToNearest), out var mi)) return;

            var (w, h) = PhysicalSize(mi);
            var margin = Scaled(12, mi);
            var gapX = Scaled(16, mi);
            var gapY = Scaled(20, mi);

            var left = pt.X + gapX;
            var top = pt.Y + gapY;
            /* 右侧/下方放不下就翻到光标另一侧 */
            if (left + w > mi.Work.Right - margin) left = pt.X - gapX - w;
            if (top + h > mi.Work.Bottom - margin) top = pt.Y - gapY - h;

            MovePhysical(
                Clamp(left, mi.Work.Left + margin, mi.Work.Right - margin - w),
                Clamp(top, mi.Work.Top + margin, mi.Work.Bottom - margin - h));
        }

        /// <summary>放到主窗口所在显示器的右上角（不跟随鼠标时用）。</summary>
        public void PlaceTopRight()
        {
            var owner = Application.Current?.MainWindow;
            var ownerHandle = owner != null ? new WindowInteropHelper(owner).Handle : IntPtr.Zero;
            var monitor = ownerHandle != IntPtr.Zero
                ? MonitorFromWindow(ownerHandle, MonitorDefaultToNearest)
                : MonitorFromPoint(new POINT { X = 0, Y = 0 }, MonitorDefaultToNearest);
            if (!TryMonitorInfo(monitor, out var mi)) return;

            var (w, _) = PhysicalSize(mi);
            var margin = Scaled(40, mi);
            MovePhysical(
                Clamp(mi.Work.Right - w - margin, mi.Work.Left + Scaled(12, mi), mi.Work.Right - w - Scaled(12, mi)),
                mi.Work.Top + Scaled(80, mi));
        }

        /// <summary>窗口变高（结果变多）后重新钳进它当前所在显示器的可见区域。</summary>
        public void ClampToWorkArea()
        {
            var handle = new WindowInteropHelper(this).Handle;
            if (handle == IntPtr.Zero) return;
            if (!TryMonitorInfo(MonitorFromWindow(handle, MonitorDefaultToNearest), out var mi)) return;
            if (!GetWindowRect(handle, out var cur)) return;

            var (w, h) = PhysicalSize(mi, ActualWidth, ActualHeight);
            var margin = Scaled(12, mi);
            var left = Clamp(cur.Left, mi.Work.Left + margin, mi.Work.Right - margin - w);
            var top = Clamp(cur.Top, mi.Work.Top + margin, mi.Work.Bottom - margin - h);
            if (left != cur.Left || top != cur.Top) MovePhysical(left, top);
        }

        /// <summary>用物理像素设置位置：绕开 WPF 的 DIP 换算，多显示器混合 DPI 下也精确。</summary>
        private void MovePhysical(int left, int top)
        {
            var handle = new WindowInteropHelper(this).Handle;
            if (handle == IntPtr.Zero)
            {
                /* 还没创建 HWND（Show 之前）：退回 DIP 赋值，下次 SizeChanged 会再钳一次 */
                Left = left / MonitorScale(MonitorFromPoint(new POINT { X = 0, Y = 0 }, MonitorDefaultToNearest));
                Top = top / MonitorScale(MonitorFromPoint(new POINT { X = 0, Y = 0 }, MonitorDefaultToNearest));
                return;
            }
            SetWindowPos(handle, IntPtr.Zero, left, top, 0, 0, SwpNoSize | SwpNoZOrder | SwpNoActivate);
        }

        private (int Width, int Height) PhysicalSize(in MonitorInfo mi) =>
            PhysicalSize(mi, Width > 0 ? Width : 432, ActualHeight > 0 ? ActualHeight : 240);

        private static (int Width, int Height) PhysicalSize(in MonitorInfo mi, double dipWidth, double dipHeight)
        {
            var scale = mi.Scale > 0 ? mi.Scale : 1.0;
            return ((int)Math.Ceiling(dipWidth * scale), (int)Math.Ceiling(dipHeight * scale));
        }

        private static int Scaled(int dip, in MonitorInfo mi) =>
            (int)Math.Round(dip * (mi.Scale > 0 ? mi.Scale : 1.0));

        private static int Clamp(int value, int min, int max) =>
            max < min ? min : Math.Max(min, Math.Min(max, value));

        private static bool TryMonitorInfo(IntPtr monitor, out MonitorInfo info)
        {
            info = default;
            var raw = new MONITORINFO { cbSize = Marshal.SizeOf<MONITORINFO>() };
            if (monitor == IntPtr.Zero || !GetMonitorInfo(monitor, ref raw)) return false;

            var scale = 1.0;
            if (GetDpiForMonitor(monitor, MdtEffectiveDpi, out var dpiX, out _) == 0 && dpiX > 0)
            {
                scale = dpiX / 96.0;
            }
            info = new MonitorInfo { Work = raw.rcWork, Monitor = raw.rcMonitor, Scale = scale };
            return true;
        }

        private static double MonitorScale(IntPtr monitor) =>
            TryMonitorInfo(monitor, out var mi) ? mi.Scale : 1.0;

        /* ------------------------------------------------------------------ */
        /* 窗口设置（不透明度 / 置顶）                                          */
        /* ------------------------------------------------------------------ */

        private static string SettingsPath => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Stm32Atlas", "mini.json");

        private void LoadSettings()
        {
            var settings = new MiniSettings();
            try
            {
                if (File.Exists(SettingsPath))
                {
                    settings = JsonSerializer.Deserialize<MiniSettings>(File.ReadAllText(SettingsPath)) ?? new MiniSettings();
                }
            }
            catch
            {
                // 配置坏了就用默认值，不影响使用
            }

            settings.Opacity = Math.Clamp(settings.Opacity, 0.4, 1.0);

            _loadingSettings = true;
            OpacitySlider.Value = Math.Round(settings.Opacity * 100);
            TopToggle.IsChecked = settings.Topmost;
            _loadingSettings = false;

            ApplyOpacity(settings.Opacity);
            Topmost = settings.Topmost;
        }

        private void SaveSettings()
        {
            try
            {
                var dir = Path.GetDirectoryName(SettingsPath);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                File.WriteAllText(SettingsPath, JsonSerializer.Serialize(new MiniSettings
                {
                    Opacity = Opacity,
                    Topmost = Topmost
                }));
            }
            catch
            {
                // 写不进去（只读目录等）也不影响本次使用
            }
        }

        private void ApplyOpacity(double value)
        {
            Opacity = Math.Clamp(value, 0.4, 1.0);
            OpacityValue.Text = Math.Round(Opacity * 100) + "%";
        }

        private void Settings_Click(object sender, RoutedEventArgs e) =>
            SettingsPanel.Visibility = SettingsPanel.Visibility == Visibility.Visible
                ? Visibility.Collapsed
                : Visibility.Visible;

        private void TopToggle_Changed(object sender, RoutedEventArgs e)
        {
            if (_loadingSettings) return;
            Topmost = TopToggle.IsChecked == true;
            SaveSettings();
        }

        private void Opacity_Changed(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            /* 构造期 Slider 先于字段初始化触发一次，用 _loadingSettings 挡掉 */
            if (_loadingSettings || OpacityValue == null) return;
            ApplyOpacity(e.NewValue / 100.0);
            SaveSettings();
        }

        /* ------------------------------------------------------------------ */
        /* 交互                                                                 */
        /* ------------------------------------------------------------------ */

        private void Shell_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.OriginalSource is DependencyObject d && IsInteractive(d)) return;
            if (e.ButtonState == MouseButtonState.Pressed) DragMove();
        }

        private static bool IsInteractive(DependencyObject? d)
        {
            while (d != null)
            {
                if (d is ListBoxItem || d is TextBox || d is System.Windows.Controls.Primitives.ButtonBase) return true;
                d = VisualTreeHelper.GetParent(d);
            }
            return false;
        }

        private void Query_TextChanged(object sender, System.Windows.Controls.TextChangedEventArgs e)
        {
            _debounce.Stop();
            _debounce.Start();
        }

        private void Query_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Down && Results.Items.Count > 0)
            {
                Results.Focus();
                if (Results.SelectedIndex < 0) Results.SelectedIndex = 0;
                e.Handled = true;
            }
            else if (e.Key == Key.Enter)
            {
                _debounce.Stop();
                QueryChanged?.Invoke(Query.Text.Trim());
                OpenSelected();
                e.Handled = true;
            }
        }

        private void Results_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
            if (e.OriginalSource is DependencyObject d && FindAncestor<ListBoxItem>(d) != null)
            {
                OpenSelected();
                e.Handled = true;
            }
        }

        private void OpenSelected()
        {
            if (Results.SelectedItem is MiniEntry entry && !string.IsNullOrEmpty(entry.Href))
            {
                OpenRequested?.Invoke(entry.Href);
            }
        }

        private static T? FindAncestor<T>(DependencyObject? d) where T : DependencyObject
        {
            while (d != null && d is not T) d = VisualTreeHelper.GetParent(d);
            return d as T;
        }

        private void OnPreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                Hide();
                e.Handled = true;
            }
            else if (e.Key == Key.Up && Results.IsFocused && Results.SelectedIndex <= 0)
            {
                Query.Focus();
                e.Handled = true;
            }
        }

        private void Watch_Click(object sender, RoutedEventArgs e)
        {
            _watch = !_watch;
            UpdateWatchButton();
            WatchChanged?.Invoke(_watch);
        }

        private void Close_Click(object sender, RoutedEventArgs e) => Hide();

        /* ------------------------------------------------------------------ */
        /* Win32：显示器工作区 / DPI / 物理像素定位                              */
        /* ------------------------------------------------------------------ */

        private const uint MonitorDefaultToNearest = 2;
        private const int MdtEffectiveDpi = 0;
        private const uint SwpNoSize = 0x0001;
        private const uint SwpNoZOrder = 0x0004;
        private const uint SwpNoActivate = 0x0010;

        [DllImport("user32.dll")]
        private static extern bool GetCursorPos(out POINT pt);

        [DllImport("user32.dll")]
        private static extern IntPtr MonitorFromPoint(POINT pt, uint flags);

        [DllImport("user32.dll")]
        private static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint flags);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);

        [DllImport("user32.dll")]
        private static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);

        [DllImport("user32.dll")]
        private static extern bool SetWindowPos(IntPtr hwnd, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);

        [DllImport("shcore.dll")]
        private static extern int GetDpiForMonitor(IntPtr hmonitor, int dpiType, out uint dpiX, out uint dpiY);

        [StructLayout(LayoutKind.Sequential)]
        private struct POINT { public int X; public int Y; }

        [StructLayout(LayoutKind.Sequential)]
        private struct RECT { public int Left, Top, Right, Bottom; }

        [StructLayout(LayoutKind.Sequential)]
        private struct MONITORINFO
        {
            public int cbSize;
            public RECT rcMonitor;
            public RECT rcWork;
            public uint dwFlags;
        }

        private readonly struct MonitorInfo
        {
            public RECT Work { get; init; }
            public RECT Monitor { get; init; }
            public double Scale { get; init; }
        }

        private sealed class MiniSettings
        {
            public double Opacity { get; set; } = 1.0;
            public bool Topmost { get; set; } = true;
        }

        public sealed class MiniEntry
        {
            public string Kind { get; set; } = "";
            public string Title { get; set; } = "";
            public string Sub { get; set; } = "";
            public string Href { get; set; } = "";
        }
    }
}

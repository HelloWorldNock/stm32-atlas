using System;
using System.Diagnostics;
using System.IO;
using System.Text.Json;

namespace Stm32Atlas
{
    /// <summary>
    /// 「资料查询」页要打开的是真实文件，所以要知道 模块资料/ 在哪。
    /// 顺序：上次手动选的目录 → 环境变量 → 从 exe / 当前目录逐级向上找。
    /// </summary>
    internal static class MaterialsRoot
    {
        private const string FolderName = "模块资料";
        private const string EnvName = "STM32ATLAS_MATERIALS";

        private static string SettingsFile => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Stm32Atlas", "materials.json");

        public static string? Find()
        {
            var saved = ReadSaved();
            if (IsRoot(saved)) return saved;

            var env = Environment.GetEnvironmentVariable(EnvName);
            if (IsRoot(env)) return env;

            foreach (var start in Starts())
            {
                var hit = ProbeUp(start);
                if (hit != null) return hit;
            }
            return null;
        }

        /// <summary>选目录：给了上层目录就往下走一层找 模块资料，直接选中也认。</summary>
        public static string? Pick()
        {
            using var dialog = new System.Windows.Forms.FolderBrowserDialog
            {
                Description = "选择 模块资料 目录（或它的上级目录）",
                UseDescriptionForTitle = true,
                ShowNewFolderButton = false,
                SelectedPath = Find() ?? ""
            };
            if (dialog.ShowDialog() != System.Windows.Forms.DialogResult.OK) return null;

            var chosen = dialog.SelectedPath;
            if (string.IsNullOrWhiteSpace(chosen)) return null;
            var inner = Path.Combine(chosen, FolderName);
            var root = Directory.Exists(inner) ? inner : chosen;
            Save(root);
            return root;
        }

        /// <summary>把索引里的相对路径解析成绝对路径，并挡住 .. 之类的越界。</summary>
        public static bool TryResolve(string? relative, out string full)
        {
            full = "";
            var root = Find();
            if (root == null) return false;

            var rel = (relative ?? "").Replace('/', Path.DirectorySeparatorChar)
                .TrimStart(Path.DirectorySeparatorChar);
            string combined;
            try { combined = Path.GetFullPath(Path.Combine(root, rel)); }
            catch { return false; }

            var fence = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar)
                        + Path.DirectorySeparatorChar;
            if (!combined.StartsWith(fence, StringComparison.OrdinalIgnoreCase)) return false;

            full = combined;
            return true;
        }

        public static bool Open(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return false;
            try
            {
                if (!File.Exists(path) && !Directory.Exists(path)) return false;
                Process.Start(new ProcessStartInfo(path) { UseShellExecute = true });
                return true;
            }
            catch { return false; }
        }

        /* ---------------- helpers ---------------- */

        private static bool IsRoot(string? path)
        {
            if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path)) return false;
            var name = Path.GetFileName(path.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
            if (string.Equals(name, FolderName, StringComparison.OrdinalIgnoreCase)) return true;

            /* 也接受直接指向模块上级目录的配置，只要里面确实有 1-xxx 这类模块目录 */
            try
            {
                foreach (var dir in Directory.GetDirectories(path))
                {
                    var leaf = Path.GetFileName(dir);
                    if (leaf.Length > 1 && char.IsDigit(leaf[0]) && leaf[1] == '-') return true;
                }
            }
            catch { /* unreadable, treat as invalid */ }
            return false;
        }

        private static string? ProbeUp(string? start)
        {
            if (string.IsNullOrWhiteSpace(start)) return null;
            try
            {
                var dir = new DirectoryInfo(start);
                for (var depth = 0; dir != null && depth < 6; depth++, dir = dir.Parent)
                {
                    var candidate = Path.Combine(dir.FullName, FolderName);
                    if (Directory.Exists(candidate)) return candidate;
                    if (string.Equals(dir.Name, FolderName, StringComparison.OrdinalIgnoreCase)) return dir.FullName;
                }
            }
            catch { /* permission or path issues */ }
            return null;
        }

        private static string?[] Starts()
        {
            string? processDir = null;
            try
            {
                var exe = Environment.ProcessPath;
                if (!string.IsNullOrEmpty(exe)) processDir = Path.GetDirectoryName(exe);
            }
            catch { /* single-file edge cases */ }

            return new[]
            {
                AppContext.BaseDirectory,
                processDir,
                SafeCurrentDir()
            };
        }

        private static string? SafeCurrentDir()
        {
            try { return Directory.GetCurrentDirectory(); } catch { return null; }
        }

        private static string? ReadSaved()
        {
            try
            {
                var file = SettingsFile;
                if (!File.Exists(file)) return null;
                using var doc = JsonDocument.Parse(File.ReadAllText(file));
                return doc.RootElement.TryGetProperty("root", out var el) ? el.GetString() : null;
            }
            catch { return null; }
        }

        private static void Save(string root)
        {
            try
            {
                var file = SettingsFile;
                var dir = Path.GetDirectoryName(file);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                File.WriteAllText(file, JsonSerializer.Serialize(new { root }));
            }
            catch { /* a missing setting only means we re-probe next launch */ }
        }
    }
}

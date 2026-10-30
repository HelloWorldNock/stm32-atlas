using System;
using System.IO;
using System.Reflection;

namespace Stm32Atlas
{
    internal static class UiAssets
    {
        /// <summary>
        /// Dev build: use the ui folder beside the exe. Single-file publish: extract the
        /// embedded copy to %LOCALAPPDATA%\Stm32Atlas\ui\{version} and serve that.
        /// </summary>
        public static string ResolveFolder()
        {
            var local = Path.Combine(AppContext.BaseDirectory, "ui");
            if (File.Exists(Path.Combine(local, "index.html")))
                return local;

            var version = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0";
            var stamp = BuildStamp();
            var uiRoot = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Stm32Atlas", "ui");
            var target = Path.Combine(uiRoot, version + "-" + stamp);

            var marker = Path.Combine(target, "index.html");
            if (File.Exists(marker)) return target;

            Directory.CreateDirectory(target);
            var assembly = Assembly.GetExecutingAssembly();
            foreach (var resource in assembly.GetManifestResourceNames())
            {
                if (!resource.StartsWith("ui/", StringComparison.OrdinalIgnoreCase) &&
                    !resource.StartsWith("ui\\", StringComparison.OrdinalIgnoreCase))
                    continue;

                var relative = resource.Substring(3).Replace('\\', '/');
                var file = Path.Combine(target, relative.Replace('/', Path.DirectorySeparatorChar));
                var dir = Path.GetDirectoryName(file);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

                using var input = assembly.GetManifestResourceStream(resource);
                if (input == null) continue;
                using var output = File.Create(file);
                input.CopyTo(output);
            }

            if (!File.Exists(marker))
                throw new FileNotFoundException("Embedded UI assets are missing.", marker);

            CleanupOld(uiRoot, target);
            return target;
        }

        /// <summary>
        /// A fresh folder per build keeps WebView2 from serving a stale cached UI after
        /// the exe is replaced. Uses the executable timestamp because Assembly.Location
        /// is empty in a single-file bundle.
        /// </summary>
        private static string BuildStamp()
        {
            try
            {
                var path = Environment.ProcessPath;
                if (!string.IsNullOrEmpty(path) && File.Exists(path))
                    return File.GetLastWriteTimeUtc(path).ToString("yyyyMMddHHmmss");
            }
            catch
            {
                // fall through to a stable folder
            }
            return "1";
        }

        private static void CleanupOld(string uiRoot, string keep)
        {
            try
            {
                foreach (var dir in Directory.GetDirectories(uiRoot))
                {
                    if (string.Equals(dir, keep, StringComparison.OrdinalIgnoreCase)) continue;
                    try { Directory.Delete(dir, true); } catch { /* in use, keep it */ }
                }
            }
            catch
            {
                // housekeeping only
            }
        }
    }
}

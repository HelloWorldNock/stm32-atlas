package com.stm32atlas.app;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.drawable.ColorDrawable;
import android.content.pm.ApplicationInfo;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * STM32 库字典 · 安卓壳。
 *
 * 纯框架实现：一个 WebView + 自定义 origin（https://atlas.local）。
 * 页面资源全部从 APK 的 assets/ui 里读（shouldInterceptRequest 拦截），
 * 不申请 INTERNET 权限，全程离线，和桌面版共用同一套 app/ui 前端。
 */
public class MainActivity extends Activity {

    private static final String TAG = "AtlasAndroid";
    private static final String ORIGIN = "https://atlas.local";
    private static final String ASSET_ROOT = "ui/";
    private static final String COLOR_LIGHT = "#F3F6FB";
    private static final String COLOR_DARK = "#0B1120";

    private FrameLayout root;
    private WebView web;
    private SharedPreferences prefs;
    /** 资源很小（全部加起来几 MB），整包缓存避免重复 IO。 */
    private final HashMap<String, byte[]> cache = new HashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        prefs = getSharedPreferences("atlas", MODE_PRIVATE);
        final String theme = prefs.getString("theme", "light");

        root = new FrameLayout(this);
        root.setBackgroundColor(themeColor(theme));
        setContentView(root);

        web = new WebView(this);
        web.setBackgroundColor(themeColor(theme));
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        setUpWindow(theme);
        setUpWebView();

        web.addJavascriptInterface(new Host(this), "AtlasAndroid");
        web.loadUrl(ORIGIN + "/index.html");
    }

    /* ------------------------------------------------------------------ */
    /* 窗口：edge-to-edge + insets 内边距 + 状态栏图标明暗                 */
    /* ------------------------------------------------------------------ */

    private void setUpWindow(final String theme) {
        final Window w = getWindow();
        w.setBackgroundDrawable(new ColorDrawable(themeColor(theme)));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // targetSdk 35 在 Android 15 上强制 edge-to-edge，系统栏颜色已无效，
            // 统一改成"自己给根容器加 insets 内边距"这一条路径。
            w.setDecorFitsSystemWindows(false);
            w.setStatusBarColor(Color.TRANSPARENT);
            w.setNavigationBarColor(Color.TRANSPARENT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                w.setStatusBarContrastEnforced(false);
                w.setNavigationBarContrastEnforced(false);
            }
            root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override
                public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                    Insets bars = insets.getInsets(
                            WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                    Insets ime = insets.getInsets(WindowInsets.Type.ime());
                    v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                    return insets;
                }
            });
        }

        setBarIcons(!"dark".equals(theme));
    }

    /** darkIcons=true 表示浅色底 → 状态栏文字变深。 */
    private void setBarIcons(final boolean darkIcons) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                c.setSystemBarsAppearance(darkIcons ? mask : 0, mask);
            }
            return;
        }
        View decor = getWindow().getDecorView();
        int flags = decor.getSystemUiVisibility();
        if (darkIcons) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        } else {
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (darkIcons) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            } else {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
        }
        decor.setSystemUiVisibility(flags);
    }

    /* ------------------------------------------------------------------ */
    /* WebView                                                            */
    /* ------------------------------------------------------------------ */

    @SuppressWarnings("deprecation")
    private void setUpWebView() {
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // 前端 store 用 localStorage
        s.setDatabaseEnabled(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);                    // 不跟随系统字号缩放，保持版式
        s.setDefaultTextEncodingName("utf-8");
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            s.setForceDark(WebSettings.FORCE_DARK_OFF);  // 主题由前端 CSS 控制
        }
        if (Build.VERSION.SDK_INT >= 33) {
            s.setAlgorithmicDarkeningAllowed(false);
        }

        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);

        // 只有 debuggable 构建（build-android.ps1 -Debug）才开放 chrome://inspect
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return intercept(request.getUrl().toString());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith(ORIGIN)) return false;
                Log.d(TAG, "blocked external navigation: " + url);
                return true;   // 离线应用：不离开本地 origin
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request,
                                        android.webkit.WebResourceError error) {
                Log.w(TAG, "load error " + error.getErrorCode() + " " + request.getUrl());
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.d(TAG, "console: " + m.message() + "  (" + m.sourceId() + ":" + m.lineNumber() + ")");
                return true;
            }
        });
    }

    /** 只拦自家的虚拟 origin；其余返回 null 交给 WebView（没有 INTERNET 权限，必然失败）。 */
    private WebResourceResponse intercept(String url) {
        if (!url.startsWith(ORIGIN)) return null;

        String path = url.substring(ORIGIN.length());
        int q = path.indexOf('?');
        if (q >= 0) path = path.substring(0, q);
        int h = path.indexOf('#');
        if (h >= 0) path = path.substring(0, h);
        if (path.isEmpty() || "/".equals(path)) path = "/index.html";
        if (path.startsWith("/")) path = path.substring(1);
        if (path.contains("..")) return notFound();

        byte[] data = readAsset(path);
        if (data == null) {
            Log.w(TAG, "asset miss: " + path);
            return notFound();
        }

        String mime = mimeOf(path);
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", mime);
        headers.put("Cache-Control", "no-store");
        WebResourceResponse res = new WebResourceResponse(
                mime, textLike(mime) ? "utf-8" : null, new ByteArrayInputStream(data));
        res.setResponseHeaders(headers);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            res.setStatusCodeAndReasonPhrase(200, "OK");
        }
        return res;
    }

    private WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8",
                new ByteArrayInputStream("not found".getBytes()));
    }

    private byte[] readAsset(String rel) {
        synchronized (cache) {
            byte[] hit = cache.get(rel);
            if (hit != null) return hit;
        }
        InputStream in = null;
        try {
            in = getAssets().open(ASSET_ROOT + rel);
            ByteArrayOutputStream out = new ByteArrayOutputStream(Math.max(1024, in.available()));
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            byte[] data = out.toByteArray();
            synchronized (cache) { cache.put(rel, data); }
            return data;
        } catch (Exception e) {
            return null;
        } finally {
            if (in != null) { try { in.close(); } catch (Exception ignored) { } }
        }
    }

    private static boolean textLike(String mime) {
        return mime.startsWith("text/")
                || mime.endsWith("javascript")
                || mime.endsWith("json")
                || mime.endsWith("svg+xml");
    }

    private static String mimeOf(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".woff")) return "font/woff";
        if (p.endsWith(".ttf")) return "font/ttf";
        if (p.endsWith(".otf")) return "font/otf";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".ico")) return "image/x-icon";
        if (p.endsWith(".txt") || p.endsWith(".md")) return "text/plain";
        return "application/octet-stream";
    }

    /* ------------------------------------------------------------------ */
    /* JS 桥：Android 版只处理主题/语言，其余消息忽略                      */
    /* ------------------------------------------------------------------ */

    public static class Host {
        private final MainActivity act;

        Host(MainActivity a) { this.act = a; }

        @JavascriptInterface
        public String platform() { return "android"; }

        @JavascriptInterface
        public int sdk() { return Build.VERSION.SDK_INT; }

        @JavascriptInterface
        public void post(String json) { act.onBridgeMessage(json); }
    }

    void onBridgeMessage(String json) {
        if (json == null) return;
        try {
            JSONObject o = new JSONObject(json);
            String type = o.optString("type", "");
            if ("theme".equals(type)) {
                applyTheme(o.optString("value", "light"), o.optString("lang", "zh"));
            }
        } catch (Exception e) {
            Log.w(TAG, "bridge parse failed: " + e);
        }
    }

    void applyTheme(final String theme, final String lang) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                int bg = themeColor(theme);
                root.setBackgroundColor(bg);
                web.setBackgroundColor(bg);
                getWindow().setBackgroundDrawable(new ColorDrawable(bg));
                setBarIcons(!"dark".equals(theme));
                prefs.edit()
                        .putString("theme", "dark".equals(theme) ? "dark" : "light")
                        .putString("lang", "en".equals(lang) ? "en" : "zh")
                        .apply();
            }
        });
    }

    private static int themeColor(String theme) {
        try {
            return Color.parseColor("dark".equals(theme) ? COLOR_DARK : COLOR_LIGHT);
        } catch (Exception e) {
            return Color.parseColor(COLOR_LIGHT);
        }
    }

    /* ------------------------------------------------------------------ */
    /* 生命周期：返回键走 WebView 历史                                     */
    /* ------------------------------------------------------------------ */

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            root.removeView(web);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}

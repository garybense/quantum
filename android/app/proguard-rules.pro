# Preservation for Capacitor core and plugins
-keep class com.getcapacitor.** { *; }

# Protect attributes needed for reflection and debugging
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses
-keepattributes SourceFile,LineNumberTable

# General WebView protection
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, android.webkit.WebResourceRequest, android.webkit.WebResourceError);
}

# Preserve JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

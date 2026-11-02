## Flutter wrapper
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

## Google ML Kit Pose Detection — chỉ giữ API pose mà ứng dụng thực sự dùng.
-keep class com.google.mlkit.vision.pose.** { *; }
-dontwarn com.google.mlkit.vision.pose.**

## Flutter chỉ tham chiếu Play Core cho deferred components; app không dùng tính năng này.
-dontwarn com.google.android.play.core.splitcompat.SplitCompatApplication
-dontwarn com.google.android.play.core.splitinstall.**
-dontwarn com.google.android.play.core.tasks.**

## WebView
-keep class * extends android.webkit.WebViewClient { *; }
-keep class * extends android.webkit.WebChromeClient { *; }

// swift-tools-version: 6.0
import PackageDescription

// Swift Package Manager support for React Native's SwiftPM autolinking
// (react-native >= 0.87). CocoaPods users are unaffected; see the podspec.
// The two React Native packages are resolved by the autolinker relative to
// build/generated/autolinking/libs/ReactNativeSafeAreaContext in the app.
let package = Package(
    name: "ReactNativeSafeAreaContext",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "ReactNativeSafeAreaContext", targets: ["ReactNativeSafeAreaContext"]),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "ReactNativeSafeAreaContext",
            dependencies: [
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
                .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
            ],
            path: ".",
            exclude: ["ios/RNSafeAreaContext.xcodeproj"],
            sources: ["ios", "common/cpp"],
            publicHeadersPath: "ios",
            cSettings: [
                .headerSearchPath("common/cpp"),
                .headerSearchPath("ios"),
            ],
            cxxSettings: [
                .headerSearchPath("common/cpp"),
                .headerSearchPath("ios"),
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ],
            linkerSettings: [
                .linkedFramework("UIKit"),
                .linkedFramework("Foundation"),
                .linkedFramework("CoreGraphics"),
            ]
        ),
    ],
    cxxLanguageStandard: .cxx20
)

require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

unless defined?(install_modules_dependencies)
  react_native_path = File.dirname(
    Pod::Executable.execute_command(
      'node',
      [
        '-p',
        "require.resolve('react-native/package.json', {paths: [process.argv[1]]})",
        __dir__,
      ]
    ).strip
  )
  require File.join(react_native_path, 'scripts/react_native_pods')
end

Pod::Spec.new do |s|
  s.name         = "react-native-safe-area-context"
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']

  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.ios.deployment_target = "12.4"
  s.osx.deployment_target = "10.15"
  s.tvos.deployment_target = "12.4"
  s.visionos.deployment_target = "1.0"

  s.source       = { :git => "https://github.com/AppAndFlow/react-native-safe-area-context.git", :tag => "v#{s.version}" }
  s.source_files  = "ios/*.{h,m,mm}"

  s.dependency "React-Core"

  install_modules_dependencies(s)

  s.subspec "common" do |ss|
    ss.source_files         = "common/cpp/**/*.{cpp,h}"
    ss.header_dir           = "react/renderer/components/safeareacontext"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/common/cpp\"" }
  end

  s.subspec "fabric" do |ss|
    ss.dependency "react-native-safe-area-context/common"
    ss.source_files         = "ios/Fabric/**/*.{h,m,mm}"
    ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/common/cpp\"" }
  end
end

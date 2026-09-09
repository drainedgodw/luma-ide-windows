#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include <cerrno>
#include <cstdint>
#include <cstdlib>
#include <cwchar>
#include <limits>

namespace {
enum class AccentState : int {
  Disabled = 0,
  EnableBlurBehind = 3,
};

enum class WindowCompositionAttribute : int {
  AccentPolicy = 19,
};

struct AccentPolicy {
  AccentState state;
  int flags;
  DWORD gradientColor;
  int animationId;
};

struct WindowCompositionAttributeData {
  WindowCompositionAttribute attribute;
  void* data;
  SIZE_T size;
};

using SetWindowCompositionAttributeFunction = BOOL(WINAPI*)(
    HWND,
    WindowCompositionAttributeData*);

bool parseWindowHandle(const wchar_t* value, HWND& window) {
  errno = 0;
  wchar_t* end = nullptr;
  const unsigned long long raw = std::wcstoull(value, &end, 10);
  if (errno != 0 || end == value || *end != L'\0' || raw == 0 ||
      raw > std::numeric_limits<std::uintptr_t>::max()) {
    return false;
  }
  window = reinterpret_cast<HWND>(static_cast<std::uintptr_t>(raw));
  return IsWindow(window) == TRUE;
}
}  // namespace

int wmain(int argc, wchar_t** argv) {
  if (argc != 3) return 2;

  HWND window = nullptr;
  if (!parseWindowHandle(argv[1], window)) return 3;

  AccentState state;
  if (std::wcscmp(argv[2], L"enable") == 0) {
    state = AccentState::EnableBlurBehind;
  } else if (std::wcscmp(argv[2], L"disable") == 0) {
    state = AccentState::Disabled;
  } else {
    return 4;
  }

  const HMODULE user32 = GetModuleHandleW(L"user32.dll");
  if (user32 == nullptr) return 5;
  const auto setWindowCompositionAttribute =
      reinterpret_cast<SetWindowCompositionAttributeFunction>(
          GetProcAddress(user32, "SetWindowCompositionAttribute"));
  if (setWindowCompositionAttribute == nullptr) return 6;

  // ACCENT_ENABLE_BLURBEHIND with a zero gradient color asks DWM for live
  // desktop blur without Acrylic's gray color/tint layer.
  AccentPolicy policy{state, 0, 0x00000000, 0};
  WindowCompositionAttributeData data{
      WindowCompositionAttribute::AccentPolicy, &policy, sizeof(policy)};
  return setWindowCompositionAttribute(window, &data) == TRUE ? 0 : 7;
}

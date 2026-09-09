#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include <errno.h>
#include <stdlib.h>
#include <wchar.h>

typedef enum AccentState {
  AccentDisabled = 0,
  AccentEnableBlurBehind = 3,
} AccentState;

typedef enum WindowCompositionAttribute {
  WindowCompositionAccentPolicy = 19,
} WindowCompositionAttribute;

typedef struct AccentPolicy {
  AccentState state;
  int flags;
  DWORD gradientColor;
  int animationId;
} AccentPolicy;

typedef struct WindowCompositionAttributeData {
  WindowCompositionAttribute attribute;
  void* data;
  SIZE_T size;
} WindowCompositionAttributeData;

typedef BOOL(WINAPI* SetWindowCompositionAttributeFunction)(
    HWND,
    WindowCompositionAttributeData*);

static BOOL parseWindowHandle(const wchar_t* value, HWND* window) {
  wchar_t* end = NULL;
  unsigned __int64 raw;
  errno = 0;
  raw = _wcstoui64(value, &end, 10);
  if (errno == ERANGE || end == value || *end != L'\0' || raw == 0) return FALSE;
  *window = (HWND)(UINT_PTR)raw;
  return IsWindow(*window);
}

int wmain(int argc, wchar_t** argv) {
  HMODULE user32;
  FARPROC address;
  SetWindowCompositionAttributeFunction setWindowCompositionAttribute;
  WindowCompositionAttributeData data;
  AccentPolicy policy;
  HWND window = NULL;

  if (argc != 3) return 2;
  if (!parseWindowHandle(argv[1], &window)) return 3;

  if (wcscmp(argv[2], L"enable") == 0) {
    policy.state = AccentEnableBlurBehind;
  } else if (wcscmp(argv[2], L"disable") == 0) {
    policy.state = AccentDisabled;
  } else {
    return 4;
  }

  user32 = GetModuleHandleW(L"user32.dll");
  if (user32 == NULL) return 5;
  address = GetProcAddress(user32, "SetWindowCompositionAttribute");
  if (address == NULL) return 6;
  setWindowCompositionAttribute = (SetWindowCompositionAttributeFunction)address;

  /* Zero gradient color keeps DWM blur live while removing Acrylic tint. */
  policy.flags = 0;
  policy.gradientColor = 0x00000000;
  policy.animationId = 0;
  data.attribute = WindowCompositionAccentPolicy;
  data.data = &policy;
  data.size = sizeof(policy);
  return setWindowCompositionAttribute(window, &data) ? 0 : 7;
}

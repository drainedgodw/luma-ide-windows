export type StackToolAction = 'install' | 'uninstall';
export type StackToolManager = 'node' | 'pip' | 'cargo' | 'go' | 'dotnet';
export type ExtendedStackToolManager =
  | 'maven'
  | 'vcpkg'
  | 'winget'
  | 'dotnet-package'
  | 'dotnet-workload';
export type StackToolPlatform = 'win32' | 'linux' | 'darwin';

export interface StackToolDefinition {
  manager: StackToolManager;
  extendedManager?: ExtendedStackToolManager;
  packages: string[];
  development?: boolean;
  detectedAs?: string[];
  version?: string;
  repository?: string;
  supportedPlatforms?: StackToolPlatform[];
  systemWide?: boolean;
}

export interface StackToolResult {
  ok: boolean;
  action: StackToolAction;
  command: string;
  output: string;
}

export const STACK_TOOL_CATALOG: Record<string, Record<string, StackToolDefinition>> = {
  typescript: {
    React: { manager: 'node', packages: ['react', 'react-dom'], detectedAs: ['react'] },
    'Next.js': { manager: 'node', packages: ['next'], detectedAs: ['next'] },
    Angular: { manager: 'node', packages: ['@angular/core'] },
    NestJS: { manager: 'node', packages: ['@nestjs/core'] },
    Zod: { manager: 'node', packages: ['zod'] },
    Vitest: { manager: 'node', packages: ['vitest'], development: true },
    Prisma: { manager: 'node', packages: ['prisma'] },
    tRPC: { manager: 'node', packages: ['@trpc/server'] },
  },
  javascript: {
    React: { manager: 'node', packages: ['react', 'react-dom'], detectedAs: ['react'] },
    Vue: { manager: 'node', packages: ['vue'] },
    Svelte: { manager: 'node', packages: ['svelte'] },
    Express: { manager: 'node', packages: ['express'] },
    Vite: { manager: 'node', packages: ['vite'], development: true },
    Jest: { manager: 'node', packages: ['jest'], development: true },
    Axios: { manager: 'node', packages: ['axios'] },
    'Three.js': { manager: 'node', packages: ['three'] },
  },
  python: {
    Django: { manager: 'pip', packages: ['Django'], detectedAs: ['django'] },
    FastAPI: { manager: 'pip', packages: ['fastapi'] },
    Flask: { manager: 'pip', packages: ['Flask'], detectedAs: ['flask'] },
    NumPy: { manager: 'pip', packages: ['numpy'] },
    pandas: { manager: 'pip', packages: ['pandas'] },
    PyTorch: { manager: 'pip', packages: ['torch'] },
    pytest: { manager: 'pip', packages: ['pytest'] },
  },
  rust: {
    Axum: { manager: 'cargo', packages: ['axum'] },
    'Actix Web': { manager: 'cargo', packages: ['actix-web'] },
    Rocket: { manager: 'cargo', packages: ['rocket'] },
    Bevy: { manager: 'cargo', packages: ['bevy'] },
    Tokio: { manager: 'cargo', packages: ['tokio'] },
    Serde: { manager: 'cargo', packages: ['serde'] },
    Clap: { manager: 'cargo', packages: ['clap'] },
    Rayon: { manager: 'cargo', packages: ['rayon'] },
  },
  go: {
    Gin: { manager: 'go', packages: ['github.com/gin-gonic/gin'], detectedAs: ['gin'] },
    Fiber: { manager: 'go', packages: ['github.com/gofiber/fiber/v2'], detectedAs: ['fiber'] },
    Echo: { manager: 'go', packages: ['github.com/labstack/echo/v4'], detectedAs: ['echo'] },
    Cobra: { manager: 'go', packages: ['github.com/spf13/cobra'], detectedAs: ['cobra'] },
    GORM: { manager: 'go', packages: ['gorm.io/gorm'], detectedAs: ['gorm'] },
    Testify: { manager: 'go', packages: ['github.com/stretchr/testify'], detectedAs: ['testify'] },
    Zap: { manager: 'go', packages: ['go.uber.org/zap'], detectedAs: ['zap'] },
  },
  cpp: {
    Qt: { manager: 'cargo', extendedManager: 'vcpkg', packages: ['qtbase'] },
    SDL: { manager: 'cargo', extendedManager: 'vcpkg', packages: ['sdl2'] },
    Unreal: {
      manager: 'node', extendedManager: 'winget', packages: ['EpicGames.EpicGamesLauncher'],
      detectedAs: ['EpicGames.EpicGamesLauncher'], supportedPlatforms: ['win32'], systemWide: true,
    },
    Boost: { manager: 'cargo', extendedManager: 'vcpkg', packages: ['boost'] },
    OpenGL: { manager: 'cargo', extendedManager: 'vcpkg', packages: ['opengl'] },
    Catch2: { manager: 'cargo', extendedManager: 'vcpkg', packages: ['catch2'], development: true },
    GoogleTest: { manager: 'cargo', extendedManager: 'vcpkg', packages: ['gtest'], development: true },
  },
  java: {
    Spring: { manager: 'dotnet', extendedManager: 'maven', packages: ['org.springframework:spring-context:6.2.17'], detectedAs: ['org.springframework:spring-context'] },
    Quarkus: { manager: 'dotnet', extendedManager: 'maven', packages: ['io.quarkus:quarkus-arc:3.26.3'], detectedAs: ['io.quarkus:quarkus-arc'] },
    Micronaut: { manager: 'dotnet', extendedManager: 'maven', packages: ['io.micronaut:micronaut-runtime:4.10.2'], detectedAs: ['io.micronaut:micronaut-runtime'] },
    Android: { manager: 'dotnet', extendedManager: 'maven', packages: ['com.android.tools.build:gradle:8.13.2'], detectedAs: ['com.android.tools.build:gradle'], repository: 'https://maven.google.com' },
    JUnit: { manager: 'dotnet', extendedManager: 'maven', packages: ['org.junit.jupiter:junit-jupiter:5.13.4'], detectedAs: ['org.junit.jupiter:junit-jupiter'], development: true },
    Hibernate: { manager: 'dotnet', extendedManager: 'maven', packages: ['org.hibernate.orm:hibernate-core:7.1.1.Final'], detectedAs: ['org.hibernate.orm:hibernate-core'] },
    Jackson: { manager: 'dotnet', extendedManager: 'maven', packages: ['com.fasterxml.jackson.core:jackson-databind:2.19.2'], detectedAs: ['com.fasterxml.jackson.core:jackson-databind'] },
    Guava: { manager: 'dotnet', extendedManager: 'maven', packages: ['com.google.guava:guava:33.4.8-jre'], detectedAs: ['com.google.guava:guava'] },
  },
  csharp: {
    'ASP.NET Core': { manager: 'dotnet', extendedManager: 'dotnet-package', packages: ['Microsoft.AspNetCore.OpenApi'], version: '8.0.30' },
    Blazor: { manager: 'dotnet', extendedManager: 'dotnet-package', packages: ['Microsoft.AspNetCore.Components.WebAssembly'], version: '8.0.30' },
    Unity: { manager: 'node', extendedManager: 'winget', packages: ['Unity.UnityHub'], detectedAs: ['Unity.UnityHub'], supportedPlatforms: ['win32'], systemWide: true },
    MAUI: { manager: 'dotnet', extendedManager: 'dotnet-workload', packages: ['maui'], detectedAs: ['maui'], systemWide: true },
    'Entity Framework': { manager: 'dotnet', packages: ['Microsoft.EntityFrameworkCore'] },
    xUnit: { manager: 'dotnet', packages: ['xunit'], development: true },
    NUnit: { manager: 'dotnet', packages: ['NUnit'], development: true },
    Serilog: { manager: 'dotnet', packages: ['Serilog'] },
  },
};

export function stackToolDefinition(packId: string, name: string): StackToolDefinition | undefined {
  return STACK_TOOL_CATALOG[packId]?.[name];
}
export function stackToolKey(packId: string, name: string): string { return `${packId}:${name}`; }
export function stackToolRuntimeId(definition: StackToolDefinition): string | null {
  switch (definition.extendedManager) {
    case 'maven': return 'java';
    case 'vcpkg': return 'cpp';
    case 'dotnet-package':
    case 'dotnet-workload': return 'dotnet';
    case 'winget': return null;
    case undefined: break;
  }
  switch (definition.manager) {
    case 'node': return 'node';
    case 'pip': return 'python';
    case 'cargo': return 'rust';
    case 'go': return 'go';
    case 'dotnet': return 'dotnet';
  }
}
export function isStackToolSupported(definition: StackToolDefinition, platform: StackToolPlatform): boolean {
  return !definition.supportedPlatforms || definition.supportedPlatforms.includes(platform);
}
export function isStackToolInstalled(definition: StackToolDefinition, detectedPackages: string[]): boolean {
  const detected = new Set(detectedPackages.map(normalizePackageName));
  const markers = definition.detectedAs ?? definition.packages;
  return markers.every((marker) => detected.has(normalizePackageName(marker)));
}
function normalizePackageName(name: string): string {
  return name.trim().toLocaleLowerCase().replaceAll('_', '-');
}

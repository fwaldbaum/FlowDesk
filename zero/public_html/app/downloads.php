<?php
declare(strict_types=1);

// ZERO Desktop releases, served as static files from public_html/archivos/zero/ (not in git).
// To publish a new version: upload the installers there and update this list (sizes and SHA-256 included).
const DESKTOP_DIR = '/archivos/zero';

function desktop_release(): array
{
    return [
        'version' => '1.0.0',
        'date' => '2026-11-06',
        'platforms' => [
            'windows' => [
                'name' => 'Windows',
                'requires' => 'Windows 10 u 11 de 64 bits',
                'files' => [
                    ['file' => 'ZERO-Setup-1.0.0-windows-x64.exe', 'label' => 'Instalador para Windows', 'kind' => '.exe', 'bytes' => 97772148, 'sha256' => 'fdc228e88db5e14df6ba780d68bc1232df2130dbf67a810be612ff2894c4e1d3'],
                ],
            ],
            'mac' => [
                'name' => 'macOS',
                'requires' => 'macOS 12 o superior, Apple Silicon e Intel',
                'files' => [
                    ['file' => 'ZERO-1.0.0-mac-universal.dmg', 'label' => 'Imagen de disco para Mac', 'kind' => '.dmg', 'bytes' => 205277611, 'sha256' => 'c5601dce5e30ed7e585964e96685d68ee6df4605a40805bea946c00966f9bd99'],
                ],
            ],
            'linux' => [
                'name' => 'Linux',
                'requires' => 'Linux de 64 bits (x86_64)',
                'files' => [
                    ['file' => 'ZERO-1.0.0-linux-x86_64.AppImage', 'label' => 'AppImage, para cualquier distribución', 'kind' => '.AppImage', 'bytes' => 118752295, 'sha256' => 'b5e3a759a6918878013130f58c0d1120586c9874af82802edf1c742d53cfaf07'],
                    ['file' => 'ZERO-1.0.0-linux-amd64.deb', 'label' => 'Paquete para Ubuntu y Debian', 'kind' => '.deb', 'bytes' => 82755234, 'sha256' => '37175e3d2f2356066f5e9fafe115fe321ba856603abf1643703e403861e93137'],
                ],
            ],
        ],
    ];
}

function desktop_file_url(string $file): string
{
    return DESKTOP_DIR . '/' . rawurlencode($file);
}

function format_megabytes(int $bytes): string
{
    return number_format($bytes / 1048576, 0, ',', '.') . ' MB';
}

function detect_os(string $ua): string
{
    return match (true) {
        (bool) preg_match('/Android|iPhone|iPad|iPod|Mobile/i', $ua) => 'mobile',
        (bool) preg_match('/Windows/i', $ua) => 'windows',
        (bool) preg_match('/Macintosh|Mac OS X/i', $ua) => 'mac',
        (bool) preg_match('/Linux|X11|CrOS/i', $ua) => 'linux',
        default => 'unknown',
    };
}

function os_icon(string $os, int $size = 20, string $class = ''): string
{
    static $paths = null;
    $paths ??= require APP_DIR . '/os_icons.php';
    return '<svg class="os-icon ' . e($class) . '" width="' . $size . '" height="' . $size . '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' . ($paths[$os] ?? '') . '"/></svg>';
}

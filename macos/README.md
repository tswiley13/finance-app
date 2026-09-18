# Stryde for macOS

A native SwiftUI desktop app for Stryde, talking to the same Supabase backend as
the web app. Not a web wrapper — real Mac code.

## Build & run

Requires Xcode and [XcodeGen](https://github.com/yonaskolb/XcodeGen)
(`brew install xcodegen`).

```bash
cd macos
xcodegen generate       # regenerate Stryde.xcodeproj from project.yml
open Stryde.xcodeproj    # then Run (⌘R), or build from the CLI:
xcodebuild -project Stryde.xcodeproj -scheme Stryde -configuration Debug \
  -destination 'platform=macOS' -derivedDataPath build build
open build/Build/Products/Debug/Stryde.app
```

The `.xcodeproj` and `build/` are gitignored — `project.yml` + the Swift sources
are the source of truth.

## Status

Milestone 1 (done): sign in against Supabase; dashboard shows real accounts,
income and bills with the same monthly math as the web app.

Next: port the remaining screens (Bills, Income, Accounts, Pay Periods, Debts,
Monthly Overview, Budget — redesigned).

## Signing

Currently ad-hoc signed (`CODE_SIGN_IDENTITY = -`) for personal local use —
no Apple membership needed. First launch may need right-click → Open.

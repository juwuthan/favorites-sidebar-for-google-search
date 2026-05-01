# Privacy Policy

Effective date: 2026-05-01

Publisher: Add the legal publisher name before submitting this extension to a public store.

Contact: Use the support contact or public repository issue tracker listed in the store listing.

Favorites Sidebar for Google Search is a local browser extension. It does not operate a server, include analytics, sell data, or track users across sites.

## Data Accessed

The extension requests access to browser bookmarks so it can read the favorites bar and display those favorites on Google Search pages. Bookmark data may include personal information if the user has saved personal, work, medical, financial, or other sensitive links or titles as favorites.

For each displayed favorite, the extension uses:

- bookmark title
- bookmark URL
- browser-provided favicon, when available

The extension also redirects new tabs to `https://www.google.com/`.

## Purpose of Use

Bookmark data is used only to provide the user-facing feature of showing favorites beside Google Search. New-tab redirection is used only to make Google Search the new-tab destination.

## Data Sharing

The extension does not send bookmark data to an extension developer server.

Bookmark titles and URLs are rendered into the Google Search page while the sidebar or launcher is visible. This means they are visible in the page DOM during use on Google Search. The extension is limited to Google Search pages and does not run on Gmail, Calendar, Google Photos, Drive, or other Google apps.

Favicons are loaded from the browser favicon cache through the browser extension favicon API. The extension does not use a third-party favicon service.

The extension does not sell, rent, or monetize user data.

## Data Storage

The extension does not store bookmark data. It reads the current favorites bar from the browser when needed.

The extension does not create an extension account, does not sync data to an extension backend, and does not use analytics cookies or advertising identifiers.

## User Control

Users can disable or remove the extension at any time from `edge://extensions`. Removing the extension stops access to bookmarks and disables the new-tab redirect.

Users can edit or remove browser favorites using the browser's built-in favorites manager.

## Browser Permissions

- `bookmarks`: reads the favorites bar to display favorites.
- `favicon`: reads browser-provided favicons for displayed favorites.
- Host permissions for `google.com` and `google.de`: displays the sidebar or launcher only on Google Search pages.
- New-tab override: redirects new tabs to `https://www.google.com/`.

## Children

This extension is a general productivity tool and is not directed to children.

## Changes to This Policy

If the extension's data practices change, this policy should be updated before publishing a new version.

## Contact

For support, open an issue in the public GitHub repository for this extension.

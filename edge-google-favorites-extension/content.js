const ROOT_ID = "edge-google-favorites-launcher";
const PANEL_ID = "egfl-panel";
const HIDDEN_GOOGLE_LINK_CLASS = "egfl-google-link-hidden";
const SHIFTED_GOOGLE_CONTENT_CLASS = "egfl-google-main-shift";
const GOOGLE_FOOTER_CLASS = "egfl-google-footer";
const GOOGLE_TOP_LEFT_LINKS = new Set(["über google", "about", "store"]);
const DESKTOP_LAYOUT_QUERY = "(min-width: 980px) and (min-height: 620px)";
const FOOTER_GAP_PX = 8;
const FALLBACK_ICON_COLORS = [
  ["#f8c7c1", "#d86c61"],
  ["#fddfa3", "#d59b2d"],
  ["#f5e6a4", "#b99b22"],
  ["#cce7c7", "#69a96b"],
  ["#bfe5d8", "#4f9d83"],
  ["#c9defb", "#5f8fd8"],
  ["#d7d0f4", "#8a78d6"],
  ["#f0cce6", "#c26aa3"]
];
let pendingResponsiveUpdate = 0;

function isGoogleSearchHost() {
  return ["google.de", "www.google.de", "google.com", "www.google.com"].includes(location.hostname);
}

function isGoogleSearchPath() {
  return location.pathname === "/" || location.pathname === "/search";
}

function faviconUrl(pageUrl) {
  const iconUrl = new URL(chrome.runtime.getURL("/_favicon/"));
  iconUrl.searchParams.set("pageUrl", pageUrl);
  iconUrl.searchParams.set("size", "32");
  return iconUrl.toString();
}

function hashText(text) {
  let hash = 0;

  for (const character of text) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function createFallbackIcon(bookmark) {
  const hash = hashText(`${bookmark.url}|${bookmark.title}`);
  const [fillColor, borderColor] = FALLBACK_ICON_COLORS[hash % FALLBACK_ICON_COLORS.length];
  const fallback = document.createElement("span");
  fallback.className = "egfl-fallback-icon";
  fallback.style.setProperty("--egfl-fallback-fill", fillColor);
  fallback.style.setProperty("--egfl-fallback-border", borderColor);
  fallback.title = "Kein Favicon gefunden";
  return fallback;
}

function formatBookmarkTitle(title) {
  return title
    .replace(/\s*[-–—|·•]\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function createBookmarkTile(bookmark) {
  const link = document.createElement("a");
  link.className = "egfl-tile";
  link.href = bookmark.url;
  link.title = bookmark.title;

  const iconWrap = document.createElement("span");
  iconWrap.className = "egfl-icon-wrap";

  const icon = document.createElement("img");
  icon.className = "egfl-icon";
  icon.alt = "";
  icon.src = faviconUrl(bookmark.url);
  icon.loading = "lazy";
  icon.addEventListener("error", () => {
    iconWrap.replaceChildren(createFallbackIcon(bookmark));
  });
  icon.addEventListener("load", () => {
    if (icon.naturalWidth <= 16 && icon.naturalHeight <= 16) {
      iconWrap.replaceChildren(createFallbackIcon(bookmark));
    }
  });

  iconWrap.append(icon);

  const label = document.createElement("span");
  label.className = "egfl-label";
  label.lang = "de";
  label.textContent = formatBookmarkTitle(bookmark.title);

  link.append(iconWrap, label);
  return link;
}

function createAppsIcon() {
  const icon = document.createElement("span");
  icon.className = "egfl-apps-icon";
  icon.setAttribute("aria-hidden", "true");

  for (let index = 0; index < 9; index += 1) {
    icon.append(document.createElement("span"));
  }

  return icon;
}

function setPanelOpen(root, button, isOpen) {
  const panel = root.querySelector(`#${PANEL_ID}`);

  root.classList.toggle("egfl-open", isOpen);
  button.setAttribute("aria-expanded", String(isOpen));
  panel.setAttribute("aria-hidden", String(!isOpen));
}

function updateGoogleTopLeftLinks(shouldHide) {
  for (const link of document.querySelectorAll("a")) {
    const label = link.textContent.trim().toLowerCase();

    if (!GOOGLE_TOP_LEFT_LINKS.has(label)) {
      continue;
    }

    if (!shouldHide) {
      link.classList.remove(HIDDEN_GOOGLE_LINK_CLASS);
      continue;
    }

    const rect = link.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < 96 && rect.left >= 0 && rect.left < 280) {
      link.classList.add(HIDDEN_GOOGLE_LINK_CLASS);
    }
  }
}

function isVisibleElement(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isGoogleFooterElement(element) {
  const label = element.textContent.toLowerCase();

  return (
    element.tagName === "FOOTER" ||
    element.getAttribute("role") === "contentinfo" ||
    label.includes("privacy") ||
    label.includes("terms") ||
    label.includes("datenschutz") ||
    label.includes("bedingungen") ||
    label.includes("einstellungen")
  );
}

function clearGoogleLayoutClasses() {
  for (const element of document.querySelectorAll(
    `.${SHIFTED_GOOGLE_CONTENT_CLASS}, .${GOOGLE_FOOTER_CLASS}`
  )) {
    element.classList.remove(SHIFTED_GOOGLE_CONTENT_CLASS, GOOGLE_FOOTER_CLASS);
  }
}

function findGoogleLayoutNodes() {
  const bodyChildren = [...document.body.children].filter((element) => element.id !== ROOT_ID);
  const appShell = bodyChildren.find((element) => {
    const rect = element.getBoundingClientRect();
    return element.children.length >= 2 && rect.height > window.innerHeight * 0.65;
  });

  return appShell ? [...appShell.children] : bodyChildren;
}

function applyGoogleLayout(isDesktopLayout) {
  clearGoogleLayoutClasses();
  document.documentElement.classList.toggle("egfl-sidebar-mode", isDesktopLayout);
  document.documentElement.style.removeProperty("--egfl-footer-height");

  if (!isDesktopLayout) {
    return;
  }

  for (const element of findGoogleLayoutNodes()) {
    if (!isVisibleElement(element)) {
      continue;
    }

    if (isGoogleFooterElement(element)) {
      element.classList.add(GOOGLE_FOOTER_CLASS);
    } else {
      element.classList.add(SHIFTED_GOOGLE_CONTENT_CLASS);
    }
  }

  updateSidebarFooterOffset();
}

function updateSidebarFooterOffset() {
  const footers = [...document.querySelectorAll(`.${GOOGLE_FOOTER_CLASS}`)];
  const footerHeight = footers.reduce((height, footer) => {
    const rect = footer.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return height;
    }

    return Math.max(height, Math.ceil(rect.height + FOOTER_GAP_PX));
  }, 0);

  document.documentElement.style.setProperty("--egfl-footer-height", `${footerHeight}px`);
}

function isSearchResultsPage() {
  return location.pathname === "/search" || location.pathname.startsWith("/search/");
}

function currentLayoutKey() {
  return `${location.pathname}${location.search}`;
}

function updateResponsiveMode(root, button, mediaQuery, options = {}) {
  const isDesktopLayout = mediaQuery.matches && !isSearchResultsPage();
  const previousDesktopLayout = root.classList.contains("egfl-sidebar-layout");
  const previousLayoutKey = root.dataset.egflLayoutKey || "";
  const layoutKey = currentLayoutKey();
  const layoutChanged =
    options.forceLayout ||
    previousDesktopLayout !== isDesktopLayout ||
    previousLayoutKey !== layoutKey;

  root.classList.toggle("egfl-sidebar-layout", isDesktopLayout);
  root.classList.toggle("egfl-button-layout", !isDesktopLayout);
  root.dataset.egflLayoutKey = layoutKey;

  if (isDesktopLayout || layoutChanged) {
    setPanelOpen(root, button, isDesktopLayout);
  }

  if (layoutChanged) {
    applyGoogleLayout(isDesktopLayout);
  } else if (isDesktopLayout) {
    updateSidebarFooterOffset();
  }

  updateGoogleTopLeftLinks(!isDesktopLayout);
}

function scheduleResponsiveUpdate(root, button, mediaQuery, options = {}) {
  if (pendingResponsiveUpdate) {
    cancelAnimationFrame(pendingResponsiveUpdate);
  }

  pendingResponsiveUpdate = requestAnimationFrame(() => {
    pendingResponsiveUpdate = 0;
    updateResponsiveMode(root, button, mediaQuery, options);
  });
}

function watchUrlChanges(onChange) {
  const notify = () => {
    setTimeout(onChange, 0);
  };

  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];

    history[method] = function patchedHistoryMethod(...args) {
      const result = original.apply(this, args);
      notify();
      return result;
    };
  }

  window.addEventListener("popstate", notify);
  window.addEventListener("hashchange", notify);
}

function createLauncher(bookmarks) {
  const existing = document.getElementById(ROOT_ID);
  if (existing) {
    existing.remove();
  }

  const root = document.createElement("div");
  root.id = ROOT_ID;

  const button = document.createElement("button");
  button.className = "egfl-button";
  button.type = "button";
  button.title = "Favoriten";
  button.setAttribute("aria-label", "Favoriten öffnen");
  button.setAttribute("aria-controls", PANEL_ID);
  button.setAttribute("aria-expanded", "false");
  button.append(createAppsIcon());

  const panel = document.createElement("section");
  panel.id = PANEL_ID;
  panel.className = "egfl-panel";
  panel.setAttribute("aria-label", "Meine Favoriten");
  panel.setAttribute("aria-hidden", "true");

  const header = document.createElement("div");
  header.className = "egfl-header";

  const title = document.createElement("h2");
  title.textContent = "Meine Favoriten";

  header.append(title);

  const grid = document.createElement("div");
  grid.className = "egfl-grid";

  if (bookmarks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "egfl-empty";
    empty.textContent = "Keine Favoriten in der Favoritenleiste";
    grid.append(empty);
  } else {
    grid.append(...bookmarks.map(createBookmarkTile));
  }

  panel.append(header, grid);
  root.append(button, panel);
  document.documentElement.append(root);

  const desktopLayoutQuery = window.matchMedia(DESKTOP_LAYOUT_QUERY);
  updateResponsiveMode(root, button, desktopLayoutQuery, { forceLayout: true });

  button.addEventListener("click", () => {
    if (root.classList.contains("egfl-sidebar-layout")) {
      return;
    }

    setPanelOpen(root, button, !root.classList.contains("egfl-open"));
  });

  document.addEventListener("click", (event) => {
    if (!root.classList.contains("egfl-sidebar-layout") && !root.contains(event.target)) {
      setPanelOpen(root, button, false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!root.classList.contains("egfl-sidebar-layout") && event.key === "Escape") {
      setPanelOpen(root, button, false);
      button.focus();
    }
  });

  desktopLayoutQuery.addEventListener("change", () => {
    scheduleResponsiveUpdate(root, button, desktopLayoutQuery, { forceLayout: true });
  });

  window.addEventListener("resize", () => {
    scheduleResponsiveUpdate(root, button, desktopLayoutQuery, { forceLayout: true });
  });

  window.addEventListener("load", () => {
    scheduleResponsiveUpdate(root, button, desktopLayoutQuery, { forceLayout: true });
  });

  watchUrlChanges(() => {
    scheduleResponsiveUpdate(root, button, desktopLayoutQuery, { forceLayout: true });
  });

  setTimeout(() => {
    scheduleResponsiveUpdate(root, button, desktopLayoutQuery, { forceLayout: true });
  }, 500);
}

chrome.runtime.sendMessage({ type: "GET_FAVORITES_BAR_BOOKMARKS" }, (response) => {
  if (!isGoogleSearchHost() || !isGoogleSearchPath()) {
    return;
  }

  if (chrome.runtime.lastError || !response?.ok) {
    return;
  }

  createLauncher(response.bookmarks || []);
});

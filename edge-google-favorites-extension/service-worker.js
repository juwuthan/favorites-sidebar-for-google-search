const FAVORITES_BAR_IDS = new Set(["1"]);

function flattenBookmarks(nodes, results = []) {
  for (const node of nodes || []) {
    if (node.url) {
      results.push({
        id: node.id,
        title: node.title || node.url,
        url: node.url
      });
      continue;
    }

    flattenBookmarks(node.children, results);
  }

  return results;
}

function findFavoritesBarNode(root) {
  const stack = [...(root.children || [])];

  while (stack.length > 0) {
    const node = stack.shift();
    const normalizedTitle = (node.title || "").toLowerCase();

    if (
      FAVORITES_BAR_IDS.has(node.id) ||
      normalizedTitle === "bookmarks bar" ||
      normalizedTitle === "favorites bar" ||
      normalizedTitle === "favoritenleiste" ||
      normalizedTitle === "lesezeichenleiste"
    ) {
      return node;
    }

    stack.push(...(node.children || []));
  }

  return null;
}

async function getFavoritesBarBookmarks() {
  const [root] = await chrome.bookmarks.getTree();
  const favoritesBar = findFavoritesBarNode(root);

  if (!favoritesBar) {
    return [];
  }

  return flattenBookmarks(favoritesBar.children);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "GET_FAVORITES_BAR_BOOKMARKS") {
    return false;
  }

  getFavoritesBarBookmarks()
    .then((bookmarks) => sendResponse({ ok: true, bookmarks }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

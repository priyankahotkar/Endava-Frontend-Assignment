export function Link(router, path) {
  const href = `#${path.startsWith("/") ? path : `/${path}`}`;
  return {
    href,
    onClick(e) {
      const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      if (isModified || e.button !== 0) return;
      e.preventDefault();
      router.navigate(path);
    },
  };
}


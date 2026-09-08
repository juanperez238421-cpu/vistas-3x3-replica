for (const href of ["./trace-workbench-responsive.css", "./trace-grid-visibility.css"]) {
  if (document.querySelector(`link[href="${href}"]`)) continue;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

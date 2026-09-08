const href = "./trace-workbench-responsive.css";
if (!document.querySelector(`link[href="${href}"]`)) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

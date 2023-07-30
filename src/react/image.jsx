export default function Image({ src, alt, ...props }) {
  if (!src) throw new Error("No `src` parameter provided to Image component");
  if (!alt) throw new Error("No `alt` parameter provided to Image component");
  //TODO: automatically add height and width attributes to image if not provided
  //TODO: optimize image if `sharp` is installed or optimize image flags is present in project config
  return (
    <img src={src} alt={alt} loading="lazy" decoding="async" {...props} />
  );
}
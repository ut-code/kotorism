import { Link as RouterLink, type LinkProps } from "react-router";

// next/link と同じ href 指定で使えるようにした React Router の Link
type Props = Omit<LinkProps, "to"> & { href: string };

export default function Link({ href, ...props }: Props) {
  return <RouterLink to={href} {...props} />;
}

"use client"

import NextLink from "next/link"
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation"
import * as React from "react"

type To =
  | string
  | {
      hash?: string
      pathname?: string
      search?: string
    }

type LinkProps = Omit<React.ComponentPropsWithoutRef<"a">, "href"> & {
  replace?: boolean
  to: To
}

type NavLinkProps = Omit<LinkProps, "className"> & {
  className?:
    string | ((state: { isActive: boolean; isPending: boolean }) => string)
  end?: boolean
}

type NavigateOptions = {
  preventScrollReset?: boolean
  replace?: boolean
  state?: unknown
}

function toHref(to: To) {
  if (typeof to === "string") {
    return to
  }

  return `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}` || "/"
}

function normalizePath(href: string) {
  const [path = "/"] = href.split(/[?#]/)
  return path || "/"
}

function isActivePath(pathname: string, href: string, end?: boolean) {
  const targetPath = normalizePath(href)

  if (end || targetPath === "/") {
    return pathname === targetPath
  }

  return pathname === targetPath || pathname.startsWith(`${targetPath}/`)
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, ...props }, ref) => (
    <NextLink href={toHref(to)} replace={replace} ref={ref} {...props} />
  )
)
Link.displayName = "RouterCompatLink"

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, end, to, ...props }, ref) => {
    const pathname = usePathname() || "/"
    const href = toHref(to)
    const isActive = isActivePath(pathname, href, end)
    const resolvedClassName =
      typeof className === "function"
        ? className({ isActive, isPending: false })
        : className

    return (
      <Link
        ref={ref}
        to={to}
        className={resolvedClassName}
        aria-current={isActive ? "page" : undefined}
        {...props}
      />
    )
  }
)
NavLink.displayName = "RouterCompatNavLink"

function useLocation() {
  const pathname = usePathname() || "/"
  const searchParams = useNextSearchParams()
  const search = searchParams.toString()
  const [hash, setHash] = React.useState("")

  React.useEffect(() => {
    function syncHash() {
      setHash(window.location.hash)
    }

    syncHash()
    window.addEventListener("hashchange", syncHash)
    window.addEventListener("popstate", syncHash)

    return () => {
      window.removeEventListener("hashchange", syncHash)
      window.removeEventListener("popstate", syncHash)
    }
  }, [pathname])

  return React.useMemo(
    () => ({
      hash,
      key: pathname,
      pathname,
      search: search ? `?${search}` : "",
      state: null,
    }),
    [hash, pathname, search]
  )
}

function useNavigate() {
  const router = useRouter()

  return React.useCallback(
    (to: To | number, options: NavigateOptions = {}) => {
      if (typeof to === "number") {
        window.history.go(to)
        return
      }

      const href = toHref(to)
      const scroll = !options.preventScrollReset

      if (options.replace) {
        router.replace(href, { scroll })
        return
      }

      router.push(href, { scroll })
    },
    [router]
  )
}

function useSearchParams(): [
  URLSearchParams,
  (nextInit: URLSearchParams | Record<string, string> | string) => void,
] {
  const pathname = usePathname() || "/"
  const router = useRouter()
  const params = useNextSearchParams()
  const searchParams = React.useMemo(
    () => new URLSearchParams(params.toString()),
    [params]
  )

  const setSearchParams = React.useCallback(
    (nextInit: URLSearchParams | Record<string, string> | string) => {
      const nextParams =
        nextInit instanceof URLSearchParams
          ? nextInit
          : new URLSearchParams(nextInit)
      const search = nextParams.toString()
      router.push(search ? `${pathname}?${search}` : pathname)
    },
    [pathname, router]
  )

  return [searchParams, setSearchParams]
}

function useParams<
  TParams extends Record<string, string> = Record<string, string>,
>() {
  return useNextParams() as TParams
}

function Navigate({ replace, to }: { replace?: boolean; to: To }) {
  const navigate = useNavigate()

  React.useEffect(() => {
    navigate(to, { replace })
  }, [navigate, replace, to])

  return null
}

function BrowserRouter({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function Routes({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function Route() {
  return null
}

export {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
}

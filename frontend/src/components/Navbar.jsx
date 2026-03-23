import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import { Link } from "react-router-dom"

export function NavigationBar() {
return (
    <NavigationMenu className="w-full max-w-none justify-between p-4">
        <NavigationMenuList>
            <NavigationMenuItem>
                <NavigationMenuLink asChild className="text-xl">
                    <Link to="/" className="font-semibold">Promptly</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
        </NavigationMenuList>
        
        <NavigationMenuList>
            <NavigationMenuItem>
                <NavigationMenuLink asChild style={{ fontSize: "16px" }}>
                    <Link to="/profile" className="mx-1">Profile</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink asChild style={{ fontSize: "16px" }}>
                    <Link to="/login" className="mx-1">Login</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink asChild style={{ fontSize: "16px" }}>
                    <Link to="/signup" className="mx-1">Sign Up</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>
)
}
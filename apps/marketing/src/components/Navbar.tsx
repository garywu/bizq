import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";
import { Menu, ChevronRight, Building2, Wrench, FileText, HelpCircle } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { LogoIcon } from "./Icons";
import { industryCategories } from "../data/industries";

interface RouteProps {
  href: string;
  label: string;
}

// Mega menu data
const megaMenuData = {
  industries: {
    title: "Explore Industries",
    description: "Discover how BizQ transforms operations across 16+ industries",
    categories: industryCategories.map(cat => ({
      ...cat,
      icon: Building2,
      count: cat.industries.length
    })),
    featured: [
      {
        title: "E-commerce & Retail",
        description: "Transform online retail operations",
        href: "#industry-explorer",
        badge: "Popular"
      },
      {
        title: "Healthcare & Medical",
        description: "Enhance patient care efficiency",
        href: "#industry-explorer",
        badge: "Trending"
      },
      {
        title: "Professional Services",
        description: "Streamline consulting workflows",
        href: "#industry-explorer",
        badge: "New"
      }
    ]
  }
};

const routeList: RouteProps[] = [
  {
    href: "#tools",
    label: "Tools",
  },
  {
    href: "#articles",
    label: "Articles",
  },
  {
    href: "#faq",
    label: "FAQ",
  },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between ">
          <NavigationMenuItem className="font-bold flex">
            <a
              rel="noreferrer noopener"
              href="/"
              className="ml-2 font-bold text-xl flex"
            >
              <LogoIcon />
              BizQ
            </a>
          </NavigationMenuItem>

          {/* mobile */}
          <span className="flex md:hidden">
            <ModeToggle />

            <Sheet
              open={isOpen}
              onOpenChange={setIsOpen}
            >
              <SheetTrigger className="px-2">
                <Menu
                  className="flex md:hidden h-5 w-5"
                  onClick={() => setIsOpen(true)}
                >
                  <span className="sr-only">Menu Icon</span>
                </Menu>
              </SheetTrigger>

              <SheetContent side={"left"}>
                <SheetHeader>
                  <SheetTitle className="font-bold text-xl">
                    BizQ
                  </SheetTitle>
                </SheetHeader>
                 <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                   <a
                     rel="noreferrer noopener"
                     href="#industry-explorer"
                     onClick={() => setIsOpen(false)}
                     className={buttonVariants({ variant: "ghost" })}
                   >
                     <Building2 className="w-4 h-4 mr-2" />
                     Industries
                   </a>
                   {routeList.map(({ href, label }: RouteProps) => (
                     <a
                       rel="noreferrer noopener"
                       key={label}
                       href={href}
                       onClick={() => setIsOpen(false)}
                       className={buttonVariants({ variant: "ghost" })}
                     >
                       {label === "Tools" && <Wrench className="w-4 h-4 mr-2" />}
                       {label === "Articles" && <FileText className="w-4 h-4 mr-2" />}
                       {label === "FAQ" && <HelpCircle className="w-4 h-4 mr-2" />}
                       {label}
                     </a>
                   ))}
                  <a
                    rel="noreferrer noopener"
                    href="#"
                    className={`w-[110px] border ${buttonVariants({
                      variant: "secondary",
                    })}`}
                  >
                    Get Started
                  </a>
                </nav>
              </SheetContent>
            </Sheet>
          </span>

          {/* desktop */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-2">
              {/* Industries Mega Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-[17px] bg-transparent hover:bg-accent hover:text-accent-foreground">
                  <Building2 className="w-4 h-4 mr-2" />
                  Industries
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[800px] p-6">
                    <div className="grid grid-cols-3 gap-6">
                      {/* Left Column - Categories */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{megaMenuData.industries.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{megaMenuData.industries.description}</p>
                        </div>
                        <div className="space-y-2">
                          {megaMenuData.industries.categories.map((category) => (
                            <a
                              key={category.slug}
                              href="#industry-explorer"
                              className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{category.name}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {category.count}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Middle Column - Featured Industries */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Featured Industries</h4>
                        <div className="space-y-3">
                          {megaMenuData.industries.featured.map((item) => (
                            <a
                              key={item.title}
                              href={item.href}
                              className="block p-3 rounded-md hover:bg-accent transition-colors border"
                            >
                              <div className="flex items-start justify-between mb-1">
                                <h5 className="font-medium text-sm">{item.title}</h5>
                                <Badge variant="outline" className="text-xs ml-2">
                                  {item.badge}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Right Column - Quick Actions */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Quick Actions</h4>
                        <div className="space-y-2">
                          <a
                            href="#industry-explorer"
                            className="flex items-center gap-2 p-3 rounded-md hover:bg-accent transition-colors"
                          >
                            <Building2 className="w-4 h-4" />
                            <span className="text-sm">Browse All Industries</span>
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          </a>
                          <a
                            href="#tools"
                            className="flex items-center gap-2 p-3 rounded-md hover:bg-accent transition-colors"
                          >
                            <Wrench className="w-4 h-4" />
                            <span className="text-sm">View Business Tools</span>
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          </a>
                          <a
                            href="#articles"
                            className="flex items-center gap-2 p-3 rounded-md hover:bg-accent transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Read Latest Articles</span>
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Other Navigation Items */}
              {routeList.map((route: RouteProps, i) => (
                <NavigationMenuItem key={i}>
                  <a
                    rel="noreferrer noopener"
                    href={route.href}
                    className={`text-[17px] ${buttonVariants({
                      variant: "ghost",
                    })}`}
                  >
                    {route.label === "Tools" && <Wrench className="w-4 h-4 mr-2" />}
                    {route.label === "Articles" && <FileText className="w-4 h-4 mr-2" />}
                    {route.label === "FAQ" && <HelpCircle className="w-4 h-4 mr-2" />}
                    {route.label}
                  </a>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="hidden md:flex gap-2">
            <a
              rel="noreferrer noopener"
              href="#"
              className={`border ${buttonVariants({ variant: "secondary" })}`}
            >
              Get Started
            </a>

            <ModeToggle />
          </div>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};

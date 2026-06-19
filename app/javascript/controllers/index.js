import { application } from "./application"

import HelloController from "./hello_controller"
application.register("hello", HelloController)

import MobileNavController from "./mobile_nav_controller"
application.register("mobile-nav", MobileNavController)

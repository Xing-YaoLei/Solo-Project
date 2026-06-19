import { application } from "./application"

import HelloController from "./hello_controller"
application.register("hello", HelloController)

import SeatGeneratorController from "./seat_generator_controller"
application.register("seat-generator", SeatGeneratorController)

import FilterController from "./filter_controller"
application.register("filter", FilterController)

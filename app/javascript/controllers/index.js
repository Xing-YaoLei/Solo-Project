import { Application } from "@hotwired/stimulus"

const application = Application.start()

import SidebarController from "./sidebar_controller"
import DropdownController from "./dropdown_controller"
import FlashMessageController from "./flash_message_controller"
import TomSelectController from "./tom_select_controller"
import InlineEditController from "./inline_edit_controller"
import TabsController from "./tabs_controller"
import ModalController from "./modal_controller"
import NestedFormController from "./nested_form_controller"

application.register("sidebar", SidebarController)
application.register("dropdown", DropdownController)
application.register("flash-message", FlashMessageController)
application.register("tom-select", TomSelectController)
application.register("inline-edit", InlineEditController)
application.register("tabs", TabsController)
application.register("modal", ModalController)
application.register("nested-form", NestedFormController)

if (import.meta.hot) {
  import.meta.hot.accept(application)
}

export { application }

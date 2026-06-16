import { Application } from "@hotwired/stimulus"
import NotificationAutoDismissController from "./controllers/notification_auto_dismiss_controller"

const application = Application.start()
application.register("notification-auto-dismiss", NotificationAutoDismissController)

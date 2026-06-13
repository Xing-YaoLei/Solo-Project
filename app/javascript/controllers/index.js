import { Application } from "@hotwired/stimulus"

const application = Application.start()

import { eagerLoadControllersFrom } from "@hotwired/stimulus-loading"
eagerLoadControllersFrom("controllers", application)

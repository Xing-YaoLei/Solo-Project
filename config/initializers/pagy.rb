require 'pagy'
require 'pagy/extras/overflow'
require 'pagy/extras/metadata'
require 'pagy/extras/array'
require 'pagy/extras/countless'

Pagy::DEFAULT[:items] = 20
Pagy::DEFAULT[:overflow] = :last_page
Pagy::DEFAULT[:metadata] = [:count, :page, :items, :pages, :next, :prev]

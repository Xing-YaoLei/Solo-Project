import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  SpotLight,
  PointLight,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  HighlightLayer,
  AbstractMesh,
  Mesh,
  PointerEventTypes,
  Observable,
  Observer,
  PointerInfo
} from '@babylonjs/core'
import * as CANNON from 'cannon-es'

export type InteractiveObjectType = 'car' | 'desk' | 'cabinet' | 'reception'

export interface InteractiveObject {
  mesh: AbstractMesh
  type: InteractiveObjectType
  clueId: string
}

export class ShowroomScene {
  private engine: Engine
  private scene: Scene
  private camera: ArcRotateCamera
  private highlightLayer: HighlightLayer
  private interactiveObjects: InteractiveObject[] = []
  private world: CANNON.World
  private physicsBodies: CANNON.Body[] = []
  private highlightedMeshes: Set<AbstractMesh> = new Set()
  private pointerObserver: Observer<PointerInfo> | null = null
  private resizeHandler: () => void
  public onObjectClicked: Observable<{ type: InteractiveObjectType; clueId: string }>

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    this.scene = new Scene(this.engine)
    this.onObjectClicked = new Observable()
    this.world = new CANNON.World()
    this.world.gravity.set(0, -9.82, 0)
    this.resizeHandler = () => this.engine.resize()
    window.addEventListener('resize', this.resizeHandler)
    this.setupScene()
    this.createShowroom()
    this.setupCamera(canvas)
    this.setupLighting()
    this.setupInteraction()
    this.setupPhysics()
  }

  createShowroom(): void {
    this.createRoom()
    this.createCar()
    this.createDesk()
    this.createCabinet()
    this.createReception()
  }

  private createRoom(): void {
    const floor = MeshBuilder.CreateBox('floor', { width: 20, height: 0.2, depth: 20 }, this.scene)
    floor.position.y = -0.1
    const floorMat = new StandardMaterial('floorMat', this.scene)
    floorMat.diffuseColor = new Color3(0.2, 0.2, 0.2)
    floorMat.specularColor = new Color3(0.1, 0.1, 0.1)
    floor.material = floorMat

    const wallMat = new StandardMaterial('wallMat', this.scene)
    wallMat.diffuseColor = new Color3(0.3, 0.3, 0.3)
    wallMat.specularColor = new Color3(0.1, 0.1, 0.1)

    const backWall = MeshBuilder.CreateBox('backWall', { width: 20, height: 6, depth: 0.2 }, this.scene)
    backWall.position.set(0, 3, -10)
    backWall.material = wallMat

    const frontWall = MeshBuilder.CreateBox('frontWall', { width: 20, height: 6, depth: 0.2 }, this.scene)
    frontWall.position.set(0, 3, 10)
    frontWall.material = wallMat

    const leftWall = MeshBuilder.CreateBox('leftWall', { width: 0.2, height: 6, depth: 20 }, this.scene)
    leftWall.position.set(-10, 3, 0)
    leftWall.material = wallMat

    const rightWall = MeshBuilder.CreateBox('rightWall', { width: 0.2, height: 6, depth: 20 }, this.scene)
    rightWall.position.set(10, 3, 0)
    rightWall.material = wallMat
  }

  private createCar(): void {
    const carBody = MeshBuilder.CreateBox('carBody', { width: 4, height: 1.2, depth: 2 }, this.scene)
    carBody.position.set(0, 0.8, 0)
    const carBodyMat = new StandardMaterial('carBodyMat', this.scene)
    carBodyMat.diffuseColor = new Color3(0.173, 0.243, 0.314)
    carBodyMat.specularColor = new Color3(0.3, 0.3, 0.3)
    carBody.material = carBodyMat
    carBody.metadata = { type: 'car', clueId: 'clue_car_1' }
    this.interactiveObjects.push({ mesh: carBody, type: 'car', clueId: 'clue_car_1' })

    const carRoof = MeshBuilder.CreateBox('carRoof', { width: 2.5, height: 0.8, depth: 1.8 }, this.scene)
    carRoof.position.set(-0.2, 1, 0)
    const carRoofMat = new StandardMaterial('carRoofMat', this.scene)
    carRoofMat.diffuseColor = new Color3(0.22, 0.29, 0.36)
    carRoofMat.specularColor = new Color3(0.3, 0.3, 0.3)
    carRoof.material = carRoofMat
    carRoof.parent = carBody

    const wheelMat = new StandardMaterial('wheelMat', this.scene)
    wheelMat.diffuseColor = new Color3(0.15, 0.15, 0.15)
    wheelMat.specularColor = new Color3(0.05, 0.05, 0.05)

    const wheelPositions = [
      { x: -1.3, z: -1.1 },
      { x: -1.3, z: 1.1 },
      { x: 1.3, z: -1.1 },
      { x: 1.3, z: 1.1 }
    ]

    wheelPositions.forEach((pos, i) => {
      const wheel = MeshBuilder.CreateCylinder(`wheel_${i}`, { height: 0.3, diameter: 0.6 }, this.scene)
      wheel.position.set(pos.x, -0.5, pos.z)
      wheel.rotation.z = Math.PI / 2
      wheel.material = wheelMat
      wheel.parent = carBody
    })
  }

  private createDesk(): void {
    const deskMat = new StandardMaterial('deskMat', this.scene)
    deskMat.diffuseColor = new Color3(0.45, 0.32, 0.22)
    deskMat.specularColor = new Color3(0.1, 0.1, 0.1)

    const tableTop = MeshBuilder.CreateBox('deskTop', { width: 2, height: 0.1, depth: 1 }, this.scene)
    tableTop.position.set(-6, 0.8, 0)
    tableTop.material = deskMat

    const legPositions = [
      { x: -6.9, z: -0.4 },
      { x: -6.9, z: 0.4 },
      { x: -5.1, z: -0.4 },
      { x: -5.1, z: 0.4 }
    ]

    legPositions.forEach((pos, i) => {
      const leg = MeshBuilder.CreateBox(`deskLeg_${i}`, { width: 0.1, height: 0.8, depth: 0.1 }, this.scene)
      leg.position.set(pos.x, 0.4, pos.z)
      leg.material = deskMat
    })

    const paperMat1 = new StandardMaterial('paperMat1', this.scene)
    paperMat1.diffuseColor = new Color3(0.9, 0.88, 0.8)
    paperMat1.specularColor = new Color3(0.1, 0.1, 0.1)

    const paperMat2 = new StandardMaterial('paperMat2', this.scene)
    paperMat2.diffuseColor = new Color3(0.85, 0.82, 0.7)
    paperMat2.specularColor = new Color3(0.1, 0.1, 0.1)

    const paper1 = MeshBuilder.CreateBox('paper1', { width: 0.4, height: 0.02, depth: 0.3 }, this.scene)
    paper1.position.set(-6.2, 0.86, 0.1)
    paper1.rotation.y = 0.1
    paper1.material = paperMat1
    paper1.metadata = { type: 'desk', clueId: 'clue_record_1' }
    this.interactiveObjects.push({ mesh: paper1, type: 'desk', clueId: 'clue_record_1' })

    const paper2 = MeshBuilder.CreateBox('paper2', { width: 0.35, height: 0.02, depth: 0.25 }, this.scene)
    paper2.position.set(-5.7, 0.86, -0.1)
    paper2.rotation.y = -0.15
    paper2.material = paperMat2
    paper2.metadata = { type: 'desk', clueId: 'clue_record_2' }
    this.interactiveObjects.push({ mesh: paper2, type: 'desk', clueId: 'clue_record_2' })
  }

  private createCabinet(): void {
    const drawerColors = [
      new Color3(0.4, 0.4, 0.4),
      new Color3(0.35, 0.35, 0.35),
      new Color3(0.38, 0.38, 0.38)
    ]

    const handleMat = new StandardMaterial('handleMat', this.scene)
    handleMat.diffuseColor = new Color3(0.6, 0.6, 0.6)
    handleMat.specularColor = new Color3(0.2, 0.2, 0.2)

    for (let i = 0; i < 3; i++) {
      const drawer = MeshBuilder.CreateBox(`cabinetDrawer_${i}`, { width: 1, height: 0.8, depth: 0.6 }, this.scene)
      drawer.position.set(6, 0.4 + i * 0.8, 0)
      const drawerMat = new StandardMaterial(`cabinetMat_${i}`, this.scene)
      drawerMat.diffuseColor = drawerColors[i]
      drawerMat.specularColor = new Color3(0.1, 0.1, 0.1)
      drawer.material = drawerMat

      const handle = MeshBuilder.CreateBox(`cabinetHandle_${i}`, { width: 0.3, height: 0.05, depth: 0.05 }, this.scene)
      handle.position.set(6, 0.4 + i * 0.8, 0.33)
      handle.material = handleMat

      if (i < 2) {
        drawer.metadata = { type: 'cabinet', clueId: `clue_vehicle_${i + 1}` }
        this.interactiveObjects.push({ mesh: drawer, type: 'cabinet', clueId: `clue_vehicle_${i + 1}` })
      }
    }
  }

  private createReception(): void {
    const receptionMat = new StandardMaterial('receptionMat', this.scene)
    receptionMat.diffuseColor = new Color3(0.5, 0.45, 0.4)
    receptionMat.specularColor = new Color3(0.1, 0.1, 0.1)

    const deskMain = MeshBuilder.CreateBox('receptionMain', { width: 3, height: 0.9, depth: 0.8 }, this.scene)
    deskMain.position.set(-0.5, 0.45, -8)
    deskMain.material = receptionMat
    deskMain.metadata = { type: 'reception', clueId: 'clue_customer_1' }
    this.interactiveObjects.push({ mesh: deskMain, type: 'reception', clueId: 'clue_customer_1' })

    const deskSide = MeshBuilder.CreateBox('receptionSide', { width: 0.8, height: 0.9, depth: 1.5 }, this.scene)
    deskSide.position.set(-1.9, 0.45, -7.5)
    deskSide.material = receptionMat

    const counterTopMat = new StandardMaterial('counterTopMat', this.scene)
    counterTopMat.diffuseColor = new Color3(0.55, 0.5, 0.45)
    counterTopMat.specularColor = new Color3(0.15, 0.15, 0.15)

    const counterTop = MeshBuilder.CreateBox('receptionCounterTop', { width: 3.1, height: 0.05, depth: 0.9 }, this.scene)
    counterTop.position.set(-0.5, 0.92, -8)
    counterTop.material = counterTopMat

    const sideTop = MeshBuilder.CreateBox('receptionSideTop', { width: 0.9, height: 0.05, depth: 1.6 }, this.scene)
    sideTop.position.set(-1.9, 0.92, -7.5)
    sideTop.material = counterTopMat

    const monitorMat = new StandardMaterial('monitorMat', this.scene)
    monitorMat.diffuseColor = new Color3(0.15, 0.15, 0.15)
    monitorMat.specularColor = new Color3(0.3, 0.3, 0.3)

    const monitorBase = MeshBuilder.CreateBox('monitorBase', { width: 0.3, height: 0.02, depth: 0.2 }, this.scene)
    monitorBase.position.set(0, 0.95, -8)
    monitorBase.material = monitorMat

    const monitorStand = MeshBuilder.CreateBox('monitorStand', { width: 0.08, height: 0.3, depth: 0.08 }, this.scene)
    monitorStand.position.set(0, 1.1, -8)
    monitorStand.material = monitorMat

    const screenMat = new StandardMaterial('screenMat', this.scene)
    screenMat.diffuseColor = new Color3(0.1, 0.15, 0.2)
    screenMat.emissiveColor = new Color3(0.05, 0.08, 0.12)
    screenMat.specularColor = new Color3(0.5, 0.5, 0.5)

    const monitorScreen = MeshBuilder.CreateBox('monitorScreen', { width: 0.6, height: 0.4, depth: 0.03 }, this.scene)
    monitorScreen.position.set(0, 1.45, -8)
    monitorScreen.material = screenMat
    monitorScreen.metadata = { type: 'reception', clueId: 'clue_customer_2' }
    this.interactiveObjects.push({ mesh: monitorScreen, type: 'reception', clueId: 'clue_customer_2' })
  }

  private setupCamera(canvas: HTMLCanvasElement): void {
    this.camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3, 12, new Vector3(0, 1, 0), this.scene)
    this.camera.lowerBetaLimit = 0.3
    this.camera.upperBetaLimit = Math.PI / 2.2
    this.camera.lowerRadiusLimit = 5
    this.camera.upperRadiusLimit = 20
    this.camera.attachControl(canvas, true)
  }

  private setupLighting(): void {
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene)
    ambient.intensity = 0.4
    ambient.diffuse = new Color3(1, 0.95, 0.85)
    ambient.groundColor = new Color3(0.1, 0.1, 0.15)

    const spotLight = new SpotLight('spotLight', new Vector3(0, 6, 0), new Vector3(0, -1, 0), Math.PI / 4, 2, this.scene)
    spotLight.intensity = 1.2
    spotLight.diffuse = new Color3(1, 0.95, 0.88)

    const deskLight = new PointLight('deskLight', new Vector3(-6, 4, 0), this.scene)
    deskLight.intensity = 0.6
    deskLight.diffuse = new Color3(1, 0.9, 0.75)

    const cabinetLight = new PointLight('cabinetLight', new Vector3(6, 4, 0), this.scene)
    cabinetLight.intensity = 0.6
    cabinetLight.diffuse = new Color3(1, 0.9, 0.75)
  }

  private setupScene(): void {
    this.scene.clearColor = new Color4(0.1, 0.1, 0.18, 1)
    this.scene.fogMode = Scene.FOGMODE_EXP2
    this.scene.fogDensity = 0.015
    this.scene.fogColor = new Color3(0.1, 0.1, 0.18)
  }

  private setupInteraction(): void {
    this.highlightLayer = new HighlightLayer('highlightLayer', this.scene)

    this.pointerObserver = this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        this.unhighlightAll()
        const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY)
        if (pick?.hit && pick.pickedMesh) {
          const interactive = this.findInteractiveObject(pick.pickedMesh)
          if (interactive) {
            this.highlightLayer.addMesh(interactive.mesh as Mesh, new Color3(0.831, 0.647, 0.455))
            this.highlightedMeshes.add(interactive.mesh)
          }
        }
      } else if (pointerInfo.type === PointerEventTypes.POINTERTAP) {
        const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY)
        if (pick?.hit && pick.pickedMesh) {
          const interactive = this.findInteractiveObject(pick.pickedMesh)
          if (interactive) {
            this.onObjectClicked.notifyObservers({ type: interactive.type, clueId: interactive.clueId })
          }
        }
      }
    })
  }

  private findInteractiveObject(mesh: AbstractMesh): InteractiveObject | undefined {
    let current: AbstractMesh | null = mesh
    while (current) {
      const found = this.interactiveObjects.find(o => o.mesh === current)
      if (found) return found
      current = current.parent as AbstractMesh | null
    }
    return undefined
  }

  private setupPhysics(): void {
    const groundBody = new CANNON.Body({ mass: 0 })
    groundBody.addShape(new CANNON.Plane())
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    this.world.addBody(groundBody)
    this.physicsBodies.push(groundBody)

    const carPhysBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
    carPhysBody.addShape(new CANNON.Box(new CANNON.Vec3(2, 0.6, 1)))
    carPhysBody.position.set(0, 0.8, 0)
    this.world.addBody(carPhysBody)
    this.physicsBodies.push(carPhysBody)

    const paperBody1 = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
    paperBody1.addShape(new CANNON.Box(new CANNON.Vec3(0.2, 0.01, 0.15)))
    paperBody1.position.set(-6.2, 0.86, 0.1)
    this.world.addBody(paperBody1)
    this.physicsBodies.push(paperBody1)

    const paperBody2 = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
    paperBody2.addShape(new CANNON.Box(new CANNON.Vec3(0.175, 0.01, 0.125)))
    paperBody2.position.set(-5.7, 0.86, -0.1)
    this.world.addBody(paperBody2)
    this.physicsBodies.push(paperBody2)

    const drawerBody1 = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
    drawerBody1.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.4, 0.3)))
    drawerBody1.position.set(6, 0.4, 0)
    this.world.addBody(drawerBody1)
    this.physicsBodies.push(drawerBody1)

    const drawerBody2 = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
    drawerBody2.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.4, 0.3)))
    drawerBody2.position.set(6, 1.2, 0)
    this.world.addBody(drawerBody2)
    this.physicsBodies.push(drawerBody2)

    const receptionBody1 = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
    receptionBody1.addShape(new CANNON.Box(new CANNON.Vec3(1.5, 0.45, 0.4)))
    receptionBody1.position.set(-0.5, 0.45, -8)
    this.world.addBody(receptionBody1)
    this.physicsBodies.push(receptionBody1)

    const monitorBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
    monitorBody.addShape(new CANNON.Box(new CANNON.Vec3(0.3, 0.2, 0.015)))
    monitorBody.position.set(0, 1.45, -8)
    this.world.addBody(monitorBody)
    this.physicsBodies.push(monitorBody)
  }

  startRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      this.world.step(1 / 60)
      this.scene.render()
    })
  }

  dispose(): void {
    window.removeEventListener('resize', this.resizeHandler)
    if (this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver)
    }
    this.onObjectClicked.clear()
    this.physicsBodies.forEach(body => this.world.removeBody(body))
    this.physicsBodies = []
    this.interactiveObjects = []
    this.highlightedMeshes.clear()
    this.highlightLayer.dispose()
    this.scene.dispose()
    this.engine.dispose()
  }

  getInteractiveObjects(): InteractiveObject[] {
    return this.interactiveObjects
  }

  highlightObject(clueId: string): void {
    const obj = this.interactiveObjects.find(o => o.clueId === clueId)
    if (obj) {
      this.highlightLayer.addMesh(obj.mesh as Mesh, new Color3(0.831, 0.647, 0.455))
      this.highlightedMeshes.add(obj.mesh)
    }
  }

  unhighlightAll(): void {
    this.highlightedMeshes.forEach(mesh => {
      this.highlightLayer.removeMesh(mesh as Mesh)
    })
    this.highlightedMeshes.clear()
  }
}

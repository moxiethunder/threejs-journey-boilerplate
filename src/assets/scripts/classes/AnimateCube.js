import * as THREE from 'three'
import EventBus from '@scripts/services/EventBus'
import gsap from 'gsap'

class AnimateCube {
  constructor(config) {
    this.canvas = config.canvas
    this.scene = config.scene
    this.mesh = config.mesh
    this.camera = config.camera
    this.renderer = config.renderer
    this.showInfoPanel = config.show.infoPanel
    this.showControlPanel = config.show.controlPanel

    this.vars = {
      DELAY: 250,
      VELOCITY: Math.PI * 0.1,
      isDragging: false,
      isRotating: true,
      rotationPosition: { x: 0, y: 0 },
      previousMousePosition: { x: 0, y: 0 },
      defaultZoom: this.camera.position.z,
      clock: new THREE.Clock(),
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    
    if (!this.vars.isDragging && this.vars.isRotating) {
      const elapsedTime = this.vars.clock.getElapsedTime()
      
      this.mesh.rotation.x = this.vars.rotationPosition.x + elapsedTime * this.vars.VELOCITY
      this.mesh.rotation.y = this.vars.rotationPosition.y + elapsedTime * this.vars.VELOCITY
      
      this.camera.lookAt(this.mesh.position)
      if ( this.showInfoPanel ) EventBus.publish('MeshUpdated', this.mesh)
    }

    this.renderer.render(this.scene, this.camera);
  }

  onMouseDown(e) {
    this.vars.isDragging = true
    this.vars.isRotating = false
    this.vars.previousMousePosition = { x: e.offsetX, y: e.offsetY }
    this.vars.rotationPosition = { x: this.mesh.rotation.x, y: this.mesh.rotation.y }
    this.canvas.setAttribute('data-grabbing', '')
  }

  onMouseMove(e) {
    if ( !this.vars.isRotating ) {
      this.addEventListeners()
    }
    if ( this.vars.isDragging ) {
      let deltaMove = {
        x: e.offsetX - this.vars.previousMousePosition.x,
        y: e.offsetY - this.vars.previousMousePosition.y
      }

      let rotateAngleX = (deltaMove.y / window.innerHeight) * Math.PI * 2
      let rotateAngleY = (deltaMove.x / window.innerWidth) * Math.PI * 2

      gsap.to(this.mesh.rotation, {
        x: this.vars.rotationPosition.x + rotateAngleX,
        y: this.vars.rotationPosition.y + rotateAngleY,
        duration: 1,
      })

      if ( this.showInfoPanel ) EventBus.publish('MeshUpdated', this.mesh)
    }
  }

  onMouseUp() {
    this.vars.isDragging = false
    this.canvas.removeAttribute('data-grabbing')
    this.restartAnimation()
  }

  toggleAnimation(e, el) {
    if ( !this.vars.isRotating ) {
      this.addEventListeners()
      this.canvas.setAttribute('data-playing', true)
      this.restartAnimation()
    } else {
      this.removeEventListener('mouseup', this.boundOnMouseUp)
      this.canvas.setAttribute('data-playing', false)
      this.vars.isRotating = false
    }
  }

  zoomCamera(e, el) {
    const targ = e.target
    const fn = targ.dataset.actionZoom
    const pos = this.camera.position.z
    
    if ( fn === 'in' ) {
      if ( pos >= 8 ) this.camera.position.z -= 1.25;
      else if ( pos >= 4 ) this.camera.position.z -= 0.75;
      else if ( pos > 1 ) this.camera.position.z -= 0.25
    } else if ( fn === 'out' ) {
      if ( pos >= 8 ) this.camera.position.z += 1.25
      else if ( pos >= 4 ) this.camera.position.z += 0.75
      else if ( pos < 4 ) this.camera.position.z += 0.25
    }

    this.canvas.setAttribute('data-zoom', pos)

    if ( this.showInfoPanel ) EventBus.publish('CameraUpdated', this.camera)
  }

  resetCamera(e, el) {
    this.camera.position.z = this.vars.defaultZoom
    this.canvas.setAttribute('data-zoom', this.camera.position.z)
    if ( this.showInfoPanel ) EventBus.publish('CameraUpdated', this.camera)
  }

  restartAnimation() {
    setTimeout(() => {
      this.vars.clock = new THREE.Clock()
      this.vars.rotationPosition = { x: this.mesh.rotation.x, y: this.mesh.rotation.y }
      this.vars.isRotating = true
    }, this.vars.DELAY)
  }

  bindEventHandlers() {
    this.boundOnMouseDown = this.onMouseDown.bind(this)
    this.boundOnMouseMove = this.onMouseMove.bind(this)
    this.boundOnMouseUp = this.onMouseUp.bind(this)
  }

  addEventListeners() {
    this.canvas.addEventListener('mousedown', this.boundOnMouseDown)
    this.canvas.addEventListener('mousemove', this.boundOnMouseMove)
    this.canvas.addEventListener('mouseup', this.boundOnMouseUp)
  }

  removeEventListener(type, listener) {
    this.canvas.removeEventListener(type, listener)
  }

  init() {
    this.bindEventHandlers()
    this.addEventListeners()
    this.animate()
    return this
  }
}

export default AnimateCube
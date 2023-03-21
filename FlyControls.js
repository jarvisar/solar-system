import {
	EventDispatcher,
	Quaternion,
	Vector3
} from 'three';

const _changeEvent = { type: 'change' };

class FlyControls extends EventDispatcher {

	constructor( object, domElement ) {

		super();

		this.object = object;
		this.domElement = domElement;

		// API

		this.movementSpeed = 1.0;
		this.movementSpeedMultiplier = 1.0;
		this.acceleration = 0.0;
		this.speed = 1
		this.rollSpeed = 0.005;

		this.dragToLook = false;
		this.autoForward = false;

		// disable default target object behavior

		// internals

		const scope = this;

		const EPS = 0.000001;

		const lastQuaternion = new Quaternion();
		const lastPosition = new Vector3();

		this.tmpQuaternion = new Quaternion();

		this.status = 0;

		this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
		this.moveVector = new Vector3( 0, 0, 0 );
		this.rotationVector = new Vector3( 0, 0, 0 );

		this.keydown = function ( event ) {

			if ( event.altKey ) {
		
				return;
		
			}
		
			switch ( event.code ) {
		
				case 'KeyW':
					this.acceleration = 0.001;
					break;
		
				case 'KeyS':
					this.acceleration = -0.001;
					break;
		
				case 'rightshift':
					this.acceleration *= 2;
					break;
		
				case 'KeyA':
					this.moveState.rollLeft = 1;
					break;
		
				case 'KeyD':
					this.moveState.rollRight = 1;
					break;
		
			}
		
			this.updateMovementVector();
			this.updateRotationVector();
		
		};
		
		this.keyup = function ( event ) {
		
			switch ( event.code ) {
		
				case 'KeyW':
				case 'KeyS':
					this.acceleration = 0;
					break;
		
				case 'rightshift':
					this.acceleration /= 2;
					break;
		
				case 'KeyA':
					this.moveState.rollLeft = 0;
					break;
		
				case 'KeyD':
					this.moveState.rollRight = 0;
					break;
		
			}
		
			this.updateMovementVector();
			this.updateRotationVector();
		
		};
		

		this.pointerdown = function ( event ) {

			if ( this.dragToLook ) {

				this.status ++;

			} else {

				switch ( event.button ) {

					case 0: this.moveState.forward = 1; break;
					case 2: this.moveState.back = 1; break;

				}

				this.updateMovementVector();

			}

		};

		this.pointermove = function ( event ) {

			if ( ! this.dragToLook || this.status > 0 ) {

				const container = this.getContainerDimensions();
				const halfWidth = container.size[ 0 ] / 2;
				const halfHeight = container.size[ 1 ] / 2;

				this.moveState.yawLeft = - ( ( event.pageX - container.offset[ 0 ] ) - halfWidth ) / halfWidth;
				this.moveState.pitchDown = ( ( event.pageY - container.offset[ 1 ] ) - halfHeight ) / halfHeight;

				this.updateRotationVector();

			}

		};

		this.pointerup = function ( event ) {

			if ( this.dragToLook ) {

				this.status --;

				this.moveState.yawLeft = this.moveState.pitchDown = 0;

			} else {

				switch ( event.button ) {

					case 0: this.moveState.forward = 0; break;
					case 2: this.moveState.back = 0; break;

				}

				this.updateMovementVector();

			}

			this.updateRotationVector();

		};

		this.update = function ( delta ) {

			// Update speed based on acceleration
			this.speed += this.acceleration * delta;
			if (this.speed < 0) this.speed = 0;
		
			// Update movement vector based on speed and direction
			this.moveVector.z = - this.speed;
			this.moveVector.applyQuaternion( this.object.quaternion );
		
			// Move the object
			this.object.position.add( this.moveVector.multiplyScalar( delta ) );
		
			// Update the rotation based on mouse movement
			this.rotationVector.x = this.moveState.pitchDown * delta * this.rollSpeed;
			this.rotationVector.y = this.moveState.yawLeft * delta * this.rollSpeed;
			this.rotationVector.z = this.moveState.rollRight - this.moveState.rollLeft;
			this.object.rotateOnAxis( this.rotationVector, this.rotationVector.length() );
		
			if (
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS
			) {
		
				scope.dispatchEvent( _changeEvent );
				lastQuaternion.copy( scope.object.quaternion );
				lastPosition.copy( scope.object.position );
		
			}
		
		};

		this.updateMovementVector = function () {

			const forward = ( this.moveState.forward || ( this.autoForward && ! this.moveState.back ) ) ? 1 : 0;

			this.moveVector.x = ( - this.moveState.left + this.moveState.right );
			this.moveVector.y = ( - this.moveState.down + this.moveState.up );
			this.moveVector.z = ( - forward + this.moveState.back );

			//console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

		};

		this.updateRotationVector = function () {

			this.rotationVector.x = ( - this.moveState.pitchDown + this.moveState.pitchUp );
			this.rotationVector.y = ( - this.moveState.yawRight + this.moveState.yawLeft );
			this.rotationVector.z = ( - this.moveState.rollRight + this.moveState.rollLeft );

			//console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );

		};

		this.getContainerDimensions = function () {

			if ( this.domElement != document ) {

				return {
					size: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
					offset: [ this.domElement.offsetLeft, this.domElement.offsetTop ]
				};

			} else {

				return {
					size: [ window.innerWidth, window.innerHeight ],
					offset: [ 0, 0 ]
				};

			}

		};

		this.dispose = function () {

			this.domElement.removeEventListener( 'contextmenu', contextmenu );
			this.domElement.removeEventListener( 'pointerdown', _pointerdown );
			this.domElement.removeEventListener( 'pointermove', _pointermove );
			this.domElement.removeEventListener( 'pointerup', _pointerup );

			window.removeEventListener( 'keydown', _keydown );
			window.removeEventListener( 'keyup', _keyup );

		};

		const _pointermove = this.pointermove.bind( this );
		const _pointerdown = this.pointerdown.bind( this );
		const _pointerup = this.pointerup.bind( this );
		const _keydown = this.keydown.bind( this );
		const _keyup = this.keyup.bind( this );

		this.domElement.addEventListener( 'contextmenu', contextmenu );
		this.domElement.addEventListener( 'pointerdown', _pointerdown );
		this.domElement.addEventListener( 'pointermove', _pointermove );
		this.domElement.addEventListener( 'pointerup', _pointerup );

		window.addEventListener( 'keydown', _keydown );
		window.addEventListener( 'keyup', _keyup );

		this.updateMovementVector();
		this.updateRotationVector();

	}

}

function contextmenu( event ) {

	event.preventDefault();

}

export { FlyControls };

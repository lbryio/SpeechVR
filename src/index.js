/*
import React from 'react';
import ReactDOM from 'react-dom';

const Index = () => {
  return <div>Hello React!</div>;
};

ReactDOM.render(<Index />, document.body);
*/

//window.Please = require('altspace/lib/Please.min')
//require('altspace');
import STLloader from 'three/examples/js/loaders/STLLoader'
import SimplifyModifier from 'three/examples/js/modifiers/SimplifyModifier';
import BufferGeometryUtils from 'three/examples/js/BufferGeometryUtils'
//import NativeComponent from 'altspace/src/components/NativeComponent'

var modifer = new THREE.SimplifyModifier();

if(altspace) {
  var sim = new altspace.utilities.Simulation();
}
var config = {
  authorId: 'Shawn Khameneh',
  appId: 'DemoApp',
};
var sceneSync;
var enclosure;

function updateGeometryUv(geometry) {
  let max = geometry.boundingBox.max,
      min = geometry.boundingBox.min;
  let offset = new THREE.Vector2(0 - min.x, 0 - min.y);
  let range = new THREE.Vector2(max.x - min.x, max.y - min.y);
  let faces = geometry.faces;

  geometry.faceVertexUvs[0] = [];

  for(let i = 0; i < faces.length ; i++) {

      let v1 = geometry.vertices[faces[i].a],
          v2 = geometry.vertices[faces[i].b],
          v3 = geometry.vertices[faces[i].c];

      geometry.faceVertexUvs[0].push([
          new THREE.Vector2((v1.x + offset.x)/range.x ,(v1.y + offset.y)/range.y),
          new THREE.Vector2((v2.x + offset.x)/range.x ,(v2.y + offset.y)/range.y),
          new THREE.Vector2((v3.x + offset.x)/range.x ,(v3.y + offset.y)/range.y)
      ]);
  }
  geometry.uvsNeedUpdate = true;
}

//Get the enclosure
altspace.getEnclosure().then(function(e) {
  enclosure = e;

  enclosure.requestFullspace();

  /*
  var popupUrl = 'http://localhost:8000/noop' + location.search;
  altspace.open(popupUrl, '_experience', {
    target: '_experience',
    icon: 'http://localhost:8000/plus_white.png',
    hidden: true
  }).then((popup) => {
    console.log('open popup', popup);
    popup.show = () => console.log('popup show', popup);
    //popup.close();
  });
  */

  const METER = enclosure.pixelsPerMeter;

  console.log(enclosure);

  //Connect to sync server
  altspace.utilities.sync.connect(config).then(function(connection) {
    //Retrieve SceneSync
    sceneSync = new altspace.utilities.behaviors.SceneSync(connection.instance, {
      instantiators: {
        'Cube': createCube,
      },
      ready: function(firstInstance) {
        console.log('ready');
        if (firstInstance) {
          sceneSync.instantiate('Cube');
        }
      }
    });
    //Add SceneSync to the scene

    let steamVrInput = new altspace.utilities.behaviors.SteamVRInput();
    sim.scene.addBehavior(steamVrInput);
    sim.scene.addBehavior(sceneSync);


    let edit_button = new THREE.Object3D();
    edit_button.addBehaviors(new altspaceutil.behaviors.NativeComponent('n-cockpit-parent', {}, { useCollider: false }));
    edit_button.position.set(1, -.5, -1.5);

    let open_panel_button = new THREE.Mesh(new THREE.PlaneGeometry(.1,.1),new THREE.MeshBasicMaterial({transparent:true,map:new THREE.TextureLoader().load('plus_white.png')}));
    edit_button.rotation.set( -.18, -.1, 0 );
    edit_button.add(open_panel_button);
    sim.scene.add(edit_button);

    loadCurrentFile((bufferGeometry) => {
      let newSync = new altspace.utilities.behaviors.SceneSync(connection.instance, {
        instantiators: {
          'CurrentFile': function() {
            //let tolerance = 100000;
            //var simplifiedGeometry = modifer.modify( geometry, tolerance );

            var geometry = new THREE.Geometry().fromBufferGeometry( bufferGeometry );
            geometry.attributes = bufferGeometry.attributes;
            geometry.computeFaceNormals();
            geometry.mergeVertices();
            geometry.computeVertexNormals();

            //console.log(geometry.attr)
            geometry.computeBoundingBox();
            geometry.index = 0;
            //geometry.addAttribute( 'uv', new THREE.BufferAttribute( 20000, 2 ));

            updateGeometryUv(geometry);

            geometry.normalize(); // scale to "1"
            let newScale = METER * 0.5;
            geometry.scale(newScale, newScale, newScale);

            THREE.BufferGeometryUtils.computeTangents(geometry);

            var simplifiedGeometry = geometry;
            //simplifiedGeometry.dynamic = true;

            var texture = new THREE.TextureLoader().load( './lighting_fix.png' );

            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 0.2, 0.2 );

            var material = new THREE.MeshBasicMaterial({
              color: 'green',
              map: texture,
            });

            var mesh = new THREE.Mesh( simplifiedGeometry, material );

            mesh.rotation.set( - Math.PI / 2, 0, 0 );
            mesh.position.y = (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2;

            //mesh.castShadow = true;
            //mesh.receiveShadow = true;

            console.log(steamVrInput);
            mesh.addBehaviors(
              new altspace.utilities.behaviors.Object3DSync({position: true}),
              new altspace.utilities.behaviors.Drag({
                //Limit drag to within bounds of the enclosure
                x: { min: (enclosure.innerWidth / 3) * -1, max: (enclosure.innerWidth / 3)},
                //z: { min: (enclosure.innerDepth / 3) * -1, max: (enclosure.innerDepth / 3)},
                y: true,
              }),
              //new altspaceutil.behaviors.TransformControls({ controlType: 'position', showButtons: true }),
              //new altspace.utilities.behaviors.SteamVRTrackedObject()
            );
            sim.scene.add( mesh );
            return mesh;
          },
        },
        ready: function (firstInstance) {
          if(firstInstance) {
            newSync.instantiate('CurrentFile');
          }
        }
      });

      sim.scene.addBehavior(newSync);
    })
  });
});

function createCube() {
  var cubeSize = 1;
  var geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  var texture = new THREE.TextureLoader().load( './pattern.png' );

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 10, 10 );

  var material = new THREE.MeshBasicMaterial({
    color: 'green',
    map: texture,
  });


  var cube = new THREE.Mesh(geometry, material);


  //Bring the cube down closer to the user
  //cube.position.y = (enclosure.innerHeight / 4) * -1;

  cube.position.y = cubeSize;


  //Add behaviors
  cube.addBehaviors(
    new altspace.utilities.behaviors.Object3DSync({position: true}),
    new altspace.utilities.behaviors.Drag({
      //Limit drag to within bounds of the enclosure
      x: { min: (enclosure.innerWidth / 3) * -1, max: (enclosure.innerWidth / 3)},
      z: { min: (enclosure.innerDepth / 3) * -1, max: (enclosure.innerDepth / 3)}
    })
  );
  //Add event listeners
  addCubeListeners(cube);
  sim.scene.add(cube);

  return cube;
}

function loadCurrentFile(callback) {
  var loader = new THREE.STLLoader();
  loader.load( './fox.stl', function ( geometry ) {
    callback(geometry);
  });
}

function instantiateCurrentFile() {
  console.log('instantiateCurrentFile', window.CurrentFileMesh)
  return window.CurrentFileMesh;
}

function addCubeListeners(cube){
  //Add 'Drag Start' event listener
  cube.addEventListener('dragstart', function (data) {
    cube.material.color.setStyle('blue');
  });
  //Add 'Drag Stop' event listener
  cube.addEventListener('dragstop', function (data) {
    cube.material.color.setStyle('orange');
  });
}

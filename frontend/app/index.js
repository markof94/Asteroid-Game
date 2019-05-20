//===Asteroid game template===//
//============================//
//===Feel free to modify the code any way you wish, have fun ;) ===//


let backgroundImage;
let lifeImg;

//===Game objects===//
let ship;
var lasers = [];
var asteroids = [];
var explosions = [];
var collectibles = [];

let gameOver = false;



let shipSpeed = 0.1;
let lifeSize = 32; //size of the life icon in pixels
const maxLives = Koji.config.strings.maxLives; //how many max lives can the player have at any time
let startingLives = Koji.config.strings.startingLives;
let chanceToSpawnLife = Koji.config.strings.lifeChance; //how much chance to spawn a life collectible after the player breaks an asteroid
let scoreGain = Koji.config.strings.scoreGain; //how much score the player gains after destroying an asteroid, times the amount of lives they have
let highScore = 0;
let highScoreGained = false; //used for determining whether the game over screen will display if you achieved a high score
const invincibilityDuration = 0.05; //time in seconds, how long the player is invincible after hitting an asteroid, mainly used to prevent the game registering a hit twice at the same asteroid
const maxAsteroids = Koji.config.strings.maxAsteroids; //how many asteroids can there be at once
const startingAsteroids = Koji.config.strings.startingAsteroids;

let lifeOffset = 5; //how far apart should the lives be drawn


let invincibilityTimer = 0;
let score = 0;
let lives = 3;

let touchPos; //touch position for mobile
let touching = false;

//===Setup the game at start
function setup() {
    // make a canvas
    //width = window.innerWidth;
    //height = window.innerHeight;

    width = 640;
    height = 480;
    createCanvas(width, height);
  
    console.log(Koji.config.strings.startingLives);
    textFont("Cambria");
    backgroundImage = loadImage(Koji.config.images.backgroundImage);
    lifeImg = loadImage(Koji.config.images.lifeImage);
    
    touchPos = createVector(mouseX, mouseY);

    

    ship = new Ship();

    lives = startingLives;

    //spawn starting asteroids
    for (var i = 0; i < startingAsteroids; i++) {
        spawnAsteroid();    
    }

    PlaySound(Koji.config.sounds.music, true); //play background music on loop
    
}

//Repeating game function
function draw() {
 
    background(backgroundImage); //set background


    //run the timer
    invincibilityTimer -= 1/frameRate(); 

    //update mouse/touch position

    touchPos.x = mouseX;
    touchPos.y = mouseY;

  
    //===Update all asteroids===//
    for (var i = 0; i < asteroids.length; i++) {

        asteroids[i].render();
        asteroids[i].update();
        asteroids[i].edges();

        if(!gameOver){
            //===Check if ship hit an asteroid===//
            if (ship.hits(asteroids[i])) {
                if(invincibilityTimer <= 0){
                    lives--; //lose a life
                    explosions.push(new Explosion(asteroids[i].pos)); //create an explosion
                    asteroids.splice(i, 1); //remove the asteroid
                    invincibilityTimer = invincibilityDuration; //reset the timer
                }
                if(lives <= 0){
                    die();
                }else{
                    invincibilityTimer = invincibilityDuration;
                }
               
              
            }

          
        }

    }

    //===Check life collectibles for collision and behave promptly===//
    for(var i = 0; i < collectibles.length; i++){
      if(lives < maxLives){
        if (ship.hits(collectibles[i])) {
            collectibles.splice(i, 1);
            lives++;
            PlaySound(Koji.config.sounds.lifeSound);
        }
      }
         
    }

    //===Update all lasers===//
    for (var i = lasers.length - 1; i >= 0; i--) {
        lasers[i].render();
        lasers[i].update();
    if (lasers[i].offscreen()) { //remove a laser when it goes offscreen
        lasers.splice(i, 1);
    } else {
        //===Check for collision between lasers and asteroids
      for (var j = asteroids.length - 1; j >= 0; j--) {
        if (lasers[i].hits(asteroids[j])) {
            if (asteroids[j].big) {
        
                var newAsteroids = asteroids[j].breakup();
                asteroids = asteroids.concat(newAsteroids);
            }
            explosions.push(new Explosion(asteroids[j].pos)); //make an explosion
            score += scoreGain * lives; //gain score

            var roll = random()*100; //determine the probability for spawning a life
            if(roll < chanceToSpawnLife){
                collectibles.push(new LifeCollectible());
            }

            asteroids.splice(j, 1); //destroy the asteroid in collision
            lasers.splice(i, 1); //remove the laser in collision

             if(asteroids.length < maxAsteroids){ 
                spawnAsteroid(); //spawn a new asteroid at the edge of the screen if there's enough room
            }
          
            break;
          
        }
      }
      
    }
  }

    
    if(!gameOver){
        ship.render(); //stop rendering the ship on game over
    }


    //update the ship
    ship.turn();
    ship.update();
    ship.edges();
    

    //===Update all explosions===//
    for (var i = explosions.length - 1; i >= 0; i--) {
        explosions[i].update();
        explosions[i].render();

        if(explosions[i].timer <= 0){
            explosions.splice(i, 1); //remove them after their timer has elapsed
        }
    }

    //===Update all life collectibles===//
    for (var i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].update();
        collectibles[i].render();
    }

    //Draw UI
    if(gameOver){

        //game over
        textSize(40);
        fill(Koji.config.colors.gameOverTextColor);
        textAlign(CENTER);
        text(Koji.config.strings.gameOver, width / 2, height / 2 - 24);

        //press enter to restart
        textSize(16);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);
        text(Koji.config.strings.startAgain, width / 2, height / 2);

        //game over score
        textSize(24);
        fill(Koji.config.colors.textColor);
        textAlign(CENTER);
        text(Koji.config.strings.scoreEnd + " " + score,  width / 2, height / 2 + 64);

        if(highScoreGained){
            //game over score
            textSize(26);
            fill(Koji.config.colors.scoreTextColor);
            textAlign(CENTER);
            text(Koji.config.strings.newHighScore,  width / 2, height / 2 + 108);
        }else{
            //game over score
              textSize(22);
              fill(Koji.config.colors.scoreTextColor);
              textAlign(CENTER);
              text("High Score: " + highScore,  width / 2, height / 2 + 108);
        }

    }else{

        //ingame score
        textSize(32);
        fill(Koji.config.colors.scoreTextColor);
        textAlign(CENTER);
        if(Koji.config.strings.scoreIngame){
            text(Koji.config.strings.scoreIngame + " " + score, width / 2, height - 32);
        }else{
            text("" + score, width / 2, height - 32);
        }
        
    }



    //===Draw life icons===//
    for(var i = 0; i < lives; i++){
        image(lifeImg, lifeOffset + (lifeSize + lifeOffset) * i, lifeOffset, lifeSize, lifeSize);
    }
  


}


//===Keyboard functions
function keyPressed() {

    if(!gameOver){
        if (key == ' ') { //space
            lasers.push(new Laser(ship.pos, ship.heading)); //create a new laser at ship position
        } else if (keyCode == RIGHT_ARROW) { //rotate right
            ship.setRotation(1);
            ship.isTurning = true;
        } else if (keyCode == LEFT_ARROW) { //rotate left
            ship.setRotation(-1);
            ship.isTurning = true;
        } 
        if (keyCode == UP_ARROW) { //boost the ship
            ship.boosting(true);
        }
    }else{
        if (keyCode == ENTER){
            init(); //restart the game
        }
    }
 
}

function keyReleased() {
    if (keyCode == RIGHT_ARROW ||keyCode == LEFT_ARROW){
        ship.isTurning = false;
    }else if(keyCode == UP_ARROW){
        ship.boosting(false);
    }
 
  
}


//===Handle mouse/touch===//
function touchStarted(){
    touching = true;

    if(gameOver){
        init();
    }
}

function touchEnded(){
    touching = false;
    ship.fireTimer = 0; //reset timer to prevent next shot delay
}

//===Function for resetting the game
function init(){
    //center the ship
    ship.pos = createVector(width / 2, height / 2); 
    gameOver = false; 
    lives = startingLives;

    //clear all arrays
    asteroids = [];
    lasers = [];
    collectibles = [];
    explosions = [];

    for (var i = 0; i < startingAsteroids; i++) {
      spawnAsteroid();
    
    }

    score = 0; 
    highScoreGained = false;
}


//When the player is defeated
function die(){
    ship.isTurning = false;
    ship.boosting(false);
    gameOver = true;   

    //check highscore
    if(score > highScore){
        highScore = score;
        highScoreGained = true;
    }
    
}


function spawnAsteroid(){
    let side = floor(random() * 2); //determine where the new asteroid will spawn
    if(side == 0){
        asteroids.push(new Asteroid(createVector(random(width), -20)));
    }else{
        asteroids.push(new Asteroid(createVector(-20, random(height))));
    }
}


function Ship() {
    this.pos = createVector(width / 2, height / 2);
    this.r = 20; //radius of the ship, used for collision check
    this.size = createVector(42, 26); //Size of the ship in pixels

    let jetOpacity = 0; //used for jet transparencty in rendering
    
    this.heading = 0; //current angle of the ship
    this.rotation = 0;
    this.rotSpeed = 0.1;
    this.rotDir = 1; //left(-1) or right(1)
    this.vel = createVector(0, 0); //ship velocity
    this.isTurning = false;
    this.isBoosting = false;

    this.fireCooldown = 0.2; //cooldown in seconds when firing with mouse/touch
    this.fireTimer = 0;

    //Load ship images
    this.img = loadImage(Koji.config.images.shipImage);
    this.jetImg = loadImage(Koji.config.images.jetImage);


    this.boosting = function(b) {
        this.isBoosting = b;
    }

    this.update = function() {
        if (this.isBoosting) {
            this.boost();
            jetOpacity = smoothFactor(jetOpacity, 1, 0.2); //make jet visible while moving the ship
        }else{
            jetOpacity = smoothFactor(jetOpacity, 0, 0.4);
        }
        this.pos.add(this.vel); //move
        this.vel.mult(0.98); //decelerate when not moving

        //===Smooth turning===//
        if(this.isTurning){
            this.rotation = smoothFactor(this.rotation, this.rotSpeed * this.rotDir, 0.15);
        }else{
            this.rotation = smoothFactor(this.rotation, 0, 0.5);
        }


        //handle mouse/touch controls
        if(touching && !gameOver){
            this.instantRotateTo(createVector(mouseX, mouseY));
            this.boost();
            this.boosting(true);

            this.fireTimer -= 1/frameRate();
            
            if(this.fireTimer <= 0){
                lasers.push(new Laser(ship.pos, ship.heading)); //create a new laser at ship position
                this.fireTimer = this.fireCooldown;
            }
            
        }else{
            this.boosting(false);
        }
        
        
    }

    this.boost = function() {
        var force = p5.Vector.fromAngle(this.heading); //add force in direction of the ship
        force.mult(0.1);

        this.vel.add(force);
    
    }

    //collision check
    this.hits = function(asteroid) {
        var d = dist(this.pos.x, this.pos.y, asteroid.pos.x, asteroid.pos.y);
        if (d < this.r + asteroid.r * 0.5) {
        return true;
        } else {
        return false;
        }
    }

    //ship render
    this.render = function() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.heading + PI / 2);
        image(this.img, -this.size.x/2, -this.size.y/2, this.size.x, this.size.y);

        //jet render
        tint(255, 255, 255, jetOpacity * 255);
        image(this.jetImg, -this.size.x/4, this.size.y/2, this.size.x/2, this.size.x/2);
        
        pop();
    }

    //check if offscreeen
    this.edges = function() {
        if (this.pos.x > width + this.r) {
        this.pos.x = -this.r;
        } else if (this.pos.x < -this.r) {
        this.pos.x = width + this.r;
        }
        if (this.pos.y > height + this.r) {
        this.pos.y = -this.r;
        } else if (this.pos.y < -this.r) {
        this.pos.y = height + this.r;
        }
    }

    this.setRotation = function(a) {
        this.rotDir = a;

    }

    //rotate
    this.turn = function() {
        
        this.heading += this.rotation;
        
    
    }

    //rotate towards position
    this.instantRotateTo = function(goalPos){
        let dir = createVector(goalPos.x - this.pos.x, goalPos.y - this.pos.y);
        
        this.heading = dir.heading();
    }

}


function Laser(spos, angle) {
    this.pos = createVector(spos.x, spos.y); //position vector
    this.dist = p5.Vector.fromAngle(ship.heading); //position offset from ship
    this.dist.mult(15);
    this.pos = this.pos.add(this.dist);
    this.r = 12; //radius
    this.vel = p5.Vector.fromAngle(angle); //velocity vector
    this.speed = 7; //speed modifier
    this.vel.mult(this.speed);
    this.img = loadImage(Koji.config.images.laserImage);
    let scale = 0.001; //starting scale

    PlaySound(Koji.config.sounds.laserSnd);

    this.update = function() {
        this.pos.add(this.vel); //move

        if(scale < 1){
            scale = smoothFactor(scale, 1, 0.6); //scale up to 1 after spawning
        }
    }
    
    this.render = function() {
        push();
        image(this.img, this.pos.x, this.pos.y, this.r * scale, this.r * scale); //draw
        pop();
    }

    //check collision
    this.hits = function(asteroid) {
        var d = dist(this.pos.x, this.pos.y, asteroid.pos.x, asteroid.pos.y);
        if (d < (asteroid.r * 0.5 + this.r * 0.5)) {
        return true;
        } else {
        return false;
        }
    }

    //check if offscreen
    this.offscreen = function() {
        if (this.pos.x > width || this.pos.x < 0) {
        return true;
        }
        if (this.pos.y > height || this.pos.y < 0) {
        return true;
        }
        return false;
    }


}

function Asteroid(pos) {
    this.type = Math.floor((Math.random() * 3)); //assign one of the three types of asteroids
    this.big = true; //is it big?
    this.bigR = 32; //big radius
    this.smallR = 21; //small radius
    this.r = this.bigR;

    
    //if position is not assigned at new (), assign it a random one
    if (pos) {
        this.pos = pos.copy();
    } else {
        this.pos = createVector(random(width), random(height))
    }



    this.vel =  this.vel = p5.Vector.random2D(); //velocity vector
    
    this.update = function() {
        this.pos.add(this.vel); //move
    }

    this.render = function() {
        push();

        image(this.img, this.pos.x, this.pos.y, this.r, this.r); //draw
        pop();
    }

   
    //break up into smaller asteroids
    this.breakup = function() {
        var newA = [];
        newA[0] = new Asteroid(this.pos);
        newA[0].big = false;
        newA[0].checkSize();
        newA[1] = new Asteroid(this.pos);
        newA[1].big = false;
        newA[1].checkSize();
        return newA;
    }

    //check collision
    this.edges = function() {
        if (this.pos.x > width + this.r) {
        this.pos.x = -this.r;
        } else if (this.pos.x < -this.r) {
        this.pos.x = width + this.r;
        }
        if (this.pos.y > height + this.r) {
        this.pos.y = -this.r;
        } else if (this.pos.y < -this.r) {
        this.pos.y = height + this.r;
        }
    }

    //Determine the appropriate size
    this.checkSize = function(){

        if(this.big){
            this.r = this.bigR;
        }else{
            this.r = this.smallR;
        }
        
        switch(this.type){
            case 0:
            if(this.big){
                this.img = loadImage(Koji.config.images.asteroidImageBig1)
                
            }else{
                this.img = loadImage(Koji.config.images.asteroidImageSmall1)
            }
                
            break;
            case 1:
                if(this.big){
                this.img = loadImage(Koji.config.images.asteroidImageBig2)
            }else{
                this.img = loadImage(Koji.config.images.asteroidImageSmall2)
            }
            break;
            case 2:
                if(this.big){
                this.img = loadImage(Koji.config.images.asteroidImageBig3)
            }else{
                this.img = loadImage(Koji.config.images.asteroidImageSmall3)
            }
            break;
        }

    }

    this.checkSize();

}


function Explosion(pos){
    this.pos = createVector(pos.x, pos.y); //position vector
    this.scale = 0.01; //starting scale 
    this.timer = 0.2; //lifetime of the explosion
    
    this.size = random() * 40 + 30; //random size
    this.img = loadImage(Koji.config.images.explosionImage);

    PlaySound(Koji.config.sounds.explosionSound);

    this.update = function(){
        if(this.scale < 1){
            this.scale = smoothFactor(this.scale, 1, 0.2); //scale up to 1 on create
            
        }

        //tick tock
        this.timer -= 1/frameRate();
        
    }

    this.render = function(){
        //draw
        image(this.img, this.pos.x - (this.size * this.scale)/4, this.pos.y- (this.size * this.scale)/4, this.size * this.scale, this.size * this.scale);    
    }
}


function LifeCollectible() {
    this.r = 24; //radius
    this.img = loadImage(Koji.config.images.lifeImage);
    
    let side = floor(random() * 2); //determine where the new collectible will spawn
    if(side == 0){
        this.pos = createVector(random(width), -20);
    }else{
        this.pos = createVector(-20, random(height));
    }

    this.vel =  this.vel = p5.Vector.random2D(); //velocity vector

    this.update = function() {
        this.pos.add(this.vel); //move
    }

    this.render = function() {
        push();
        image(this.img, this.pos.x, this.pos.y, this.r, this.r); //draw
        pop();
    }

    //check collision
    this.edges = function() {
        if (this.pos.x > width + this.r) {
        this.pos.x = -this.r;
        } else if (this.pos.x < -this.r) {
        this.pos.x = width + this.r;
        }
        if (this.pos.y > height + this.r) {
        this.pos.y = -this.r;
        } else if (this.pos.y < -this.r) {
        this.pos.y = height + this.r;
        }
    }

}

//===Function used for smoothing values
function smoothFactor(value, goal, factor){
    return value + (goal - value) * factor;
}


//===Used for playing any sound
PlaySound = function (src, loop) {
    var audio = new Audio(src);
    audio.loop = loop;
    audio.play(); 
}

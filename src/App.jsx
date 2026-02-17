import React, { useState, useEffect, useRef } from 'react';
import { Sword, Target, Zap, Heart, Users, MessageSquare, MapPin, Trophy, Scroll, Flame, CloudRain, Sparkles } from 'lucide-react';

// Profanity filter
const filterBadWords = (text) => {
  const badWords = ['fuck', 'shit', 'ass', 'damn', 'hell', 'bitch', 'bastard', 'dick', 'pussy', 'cock'];
  let filtered = text;
  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '#'.repeat(word.length));
  });
  return filtered;
};

// Game constants
const CLASSES = {
  swordsman: { name: 'Swordsman', weapon: 'Sword', icon: '⚔️', color: '#e74c3c' },
  gunslinger: { name: 'Gunslinger', weapon: 'Assault Rifle', icon: '🔫', color: '#3498db' },
  martial_artist: { name: 'Martial Artist', weapon: 'Fists & Kicks', icon: '👊', color: '#f39c12' }
};

const WORLDS = [
  { id: 'overworld', name: 'Overworld', icon: '🌳', color: '#27ae60', unlocked: true, boss: 'Forest Guardian', scroll: false },
  { id: 'underwater', name: 'Underwater', icon: '🌊', color: '#3498db', unlocked: false, boss: 'Leviathan', scroll: false },
  { id: 'sky_kingdom', name: 'Sky Kingdom', icon: '☁️', color: '#74b9ff', unlocked: false, boss: 'Storm Titan', scroll: false },
  { id: 'underworld', name: 'Underworld', icon: '💀', color: '#8e44ad', unlocked: false, boss: 'Death King', scroll: false },
  { id: 'candy_land', name: 'Candy Land', icon: '🍭', color: '#fd79a8', unlocked: false, boss: 'Sugar Demon', scroll: false },
  { id: 'volcano', name: 'Volcano', icon: '🌋', color: '#d63031', unlocked: false, boss: 'Inferno Lord', scroll: false },
  { id: 'heaven', name: 'Heaven', icon: '✨', color: '#ffeaa7', unlocked: false, boss: 'Celestial Seraph', scroll: false }
];

const TASKS = [
  { id: 1, name: 'Defeat 10 enemies', reward: 50, xp: 100 },
  { id: 2, name: 'Explore 3 areas', reward: 30, xp: 75 },
  { id: 3, name: 'Win a PvP match', reward: 100, xp: 200 },
  { id: 4, name: 'Collect 5 items', reward: 40, xp: 80 },
  { id: 5, name: 'Deal 1000 damage', reward: 60, xp: 120 }
];

export default function PixelRPG() {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [screen, setScreen] = useState('menu'); // menu, game, pvp, worldSelect
  const [currentWorld, setCurrentWorld] = useState('overworld');
  
  // Player stats
  const [player, setPlayer] = useState({
    level: 1,
    xp: 0,
    xpToNext: 100,
    health: 100,
    maxHealth: 100,
    damage: 10,
    speed: 5,
    gold: 0,
    statPoints: 0,
    scrolls: 0
  });

  const [worlds, setWorlds] = useState(WORLDS);
  const [inBattle, setInBattle] = useState(false);
  const [enemy, setEnemy] = useState(null);
  
  // Admin system
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // Chat system
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  
  // Combat - Undertale style
  const [battleLog, setBattleLog] = useState([]);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [battlePhase, setBattlePhase] = useState('menu'); // menu, attack, dodge
  const [heartPosition, setHeartPosition] = useState({ x: 150, y: 150 });
  const [bullets, setBullets] = useState([]);
  const [dodgeTime, setDodgeTime] = useState(0);
  const [attackTargetX, setAttackTargetX] = useState(150);
  const [attackBarMoving, setAttackBarMoving] = useState(false);
  const [attackBarPosition, setAttackBarPosition] = useState(0);
  
  // Store attack pattern in ref so it persists
  const attackPatternRef = useRef(0);
  const patternTimerRef = useRef(0);
  const attackWaveRef = useRef(0);

  // Boss-specific attack patterns (Undertale style)
  const getBossAttacks = (worldId) => {
    const attacks = {
      overworld: [
        { name: 'Leaf Storm', desc: 'Green leaves fall from above!' },
        { name: 'Vine Whip', desc: 'Vines sweep across!' },
        { name: 'Root Trap', desc: 'Roots burst from below!' }
      ],
      underwater: [
        { name: 'Tidal Wave', desc: 'Water crashes from sides!' },
        { name: 'Bubble Burst', desc: 'Bubbles float and pop!' },
        { name: 'Whirlpool', desc: 'Spinning water vortex!' }
      ],
      sky_kingdom: [
        { name: 'Lightning Bolt', desc: 'Electric strikes!' },
        { name: 'Wind Gust', desc: 'Strong winds push you!' },
        { name: 'Cloud Burst', desc: 'Thunder clouds attack!' }
      ],
      underworld: [
        { name: 'Bone Attack', desc: 'Bones rise from ground!' },
        { name: 'Soul Drain', desc: 'Ghosts chase you!' },
        { name: 'Dark Blast', desc: 'Shadow orbs converge!' }
      ],
      candy_land: [
        { name: 'Candy Rain', desc: 'Sweet projectiles fall!' },
        { name: 'Lollipop Spin', desc: 'Spinning candy spirals!' },
        { name: 'Gumball Bounce', desc: 'Bouncing gumballs!' }
      ],
      volcano: [
        { name: 'Lava Eruption', desc: 'Magma bursts upward!' },
        { name: 'Fireball', desc: 'Flaming meteors!' },
        { name: 'Flame Wall', desc: 'Walls of fire close in!' }
      ],
      heaven: [
        { name: 'Holy Light', desc: 'Divine beams!' },
        { name: 'Angel Feathers', desc: 'Feathers rain down!' },
        { name: 'Celestial Ring', desc: 'Expanding halos!' }
      ]
    };
    return attacks[worldId] || attacks.overworld;
  };

  // Start game
  const startGame = () => {
    if (playerName && selectedClass) {
      setGameStarted(true);
      setScreen('game');
      addChatMessage('System', `${playerName} the ${CLASSES[selectedClass].name} has entered the world!`);
    }
  };

  // Smooth keyboard controls for dodging
  const keysPressed = useRef({});
  
  useEffect(() => {
    if (!inBattle || battlePhase !== 'dodge') return;
    
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current[e.key] = true;
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysPressed.current = {};
    };
  }, [inBattle, battlePhase]);

  // Smooth continuous movement
  useEffect(() => {
    if (!inBattle || battlePhase !== 'dodge') return;
    
    const moveInterval = setInterval(() => {
      setHeartPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const speed = 4;
        
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
          newX = Math.max(10, prev.x - speed);
        }
        if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
          newX = Math.min(290, prev.x + speed);
        }
        if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) {
          newY = Math.max(10, prev.y - speed);
        }
        if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) {
          newY = Math.min(290, prev.y + speed);
        }
        
        return { x: newX, y: newY };
      });
    }, 16); // ~60fps
    
    return () => clearInterval(moveInterval);
  }, [inBattle, battlePhase]);

  // Spacebar for attack
  useEffect(() => {
    if (!inBattle || battlePhase !== 'attack') return;
    
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        executeAttack();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inBattle, battlePhase, attackBarMoving, attackBarPosition]);

  // BULLET MOVEMENT - Must update positions continuously
  useEffect(() => {
    if (battlePhase !== 'dodge') {
      return;
    }
    
    console.log('Starting bullet animation loop');
    
    let animationId;
    const animate = () => {
      setBullets(prev => {
        if (prev.length === 0) return prev;
        
        // Move bullets
        const moved = prev.map(b => ({
          ...b,
          x: b.x + (b.dx || 0),
          y: b.y + (b.dy || 0)
        }));
        
        // Filter out off-screen bullets
        const filtered = moved.filter(b => 
          b.x > -50 && b.x < 370 && b.y > -50 && b.y < 370
        );
        
        // Check collision with player
        filtered.forEach(b => {
          const dist = Math.sqrt(
            Math.pow(b.x - heartPosition.x, 2) + 
            Math.pow(b.y - heartPosition.y, 2)
          );
          if (dist < 20) {
            const damage = 5;
            setPlayer(p => ({ ...p, health: Math.max(0, p.health - damage) }));
            console.log('HIT! Damage:', damage);
          }
        });
        
        return filtered;
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [battlePhase, heartPosition]);

  // UNDERTALE-STYLE BOSS ATTACKS
  useEffect(() => {
    if (!inBattle || battlePhase !== 'dodge') {
      setBullets([]);
      return;
    }
    
    console.log('Starting Undertale boss attack for:', currentWorld);
    
    let attackInterval;
    
    // Different patterns for each world
    if (currentWorld === 'overworld') {
      // Forest Guardian - Falling leaves
      attackInterval = setInterval(() => {
        const x = Math.random() * 280 + 20;
        setBullets(prev => [...prev, {
          x: x,
          y: -10,
          dx: (Math.random() - 0.5) * 0.5,
          dy: 2.5,
          id: Date.now() + Math.random(),
          shape: '🍃',
          color: '#27ae60'
        }]);
      }, 300);
      
    } else if (currentWorld === 'underwater') {
      // Leviathan - Bubbles rising
      attackInterval = setInterval(() => {
        const x = Math.random() * 280 + 20;
        setBullets(prev => [...prev, {
          x: x,
          y: 320,
          dx: (Math.random() - 0.5) * 1,
          dy: -2,
          id: Date.now() + Math.random(),
          shape: '🫧',
          color: '#3498db'
        }]);
      }, 400);
      
    } else if (currentWorld === 'sky_kingdom') {
      // Storm Titan - Lightning strikes
      let strikeCount = 0;
      attackInterval = setInterval(() => {
        const x = (strikeCount % 5) * 60 + 30;
        for (let i = 0; i < 6; i++) {
          setBullets(prev => [...prev, {
            x: x + (Math.random() - 0.5) * 20,
            y: i * 50,
            dx: 0,
            dy: 4,
            id: Date.now() + Math.random() + i,
            shape: '⚡',
            color: '#ffd700'
          }]);
        }
        strikeCount++;
      }, 800);
      
    } else if (currentWorld === 'underworld') {
      // Death King - Bone attack from bottom
      let boneWave = 0;
      attackInterval = setInterval(() => {
        for (let i = 0; i < 5; i++) {
          setBullets(prev => [...prev, {
            x: 30 + (i * 60 + boneWave * 30) % 280,
            y: 320,
            dx: 0,
            dy: -3.5,
            id: Date.now() + Math.random() + i,
            shape: '🦴',
            color: '#ecf0f1'
          }]);
        }
        boneWave++;
      }, 600);
      
    } else if (currentWorld === 'candy_land') {
      // Sugar Demon - Spinning lollipops
      let angle = 0;
      attackInterval = setInterval(() => {
        for (let i = 0; i < 4; i++) {
          const a = angle + (i * Math.PI / 2);
          const radius = 80;
          setBullets(prev => [...prev, {
            x: 150 + Math.cos(a) * radius,
            y: 150 + Math.sin(a) * radius,
            dx: Math.cos(a) * 1.5,
            dy: Math.sin(a) * 1.5,
            id: Date.now() + Math.random() + i,
            shape: '🍭',
            color: '#fd79a8'
          }]);
        }
        angle += 0.4;
      }, 400);
      
    } else if (currentWorld === 'volcano') {
      // Inferno Lord - Lava eruptions
      attackInterval = setInterval(() => {
        const x = Math.random() * 260 + 30;
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            setBullets(prev => [...prev, {
              x: x + (Math.random() - 0.5) * 20,
              y: 320,
              dx: (Math.random() - 0.5) * 2,
              dy: -4 - Math.random() * 2,
              id: Date.now() + Math.random(),
              shape: '🔥',
              color: '#d63031'
            }]);
          }, i * 100);
        }
      }, 700);
      
    } else if (currentWorld === 'heaven') {
      // Celestial Seraph - Expanding star rings
      let ringPhase = 0;
      attackInterval = setInterval(() => {
        const radius = 40 + (ringPhase % 3) * 40;
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          setBullets(prev => [...prev, {
            x: 150 + Math.cos(angle) * radius,
            y: 150 + Math.sin(angle) * radius,
            dx: Math.cos(angle) * 1.5,
            dy: Math.sin(angle) * 1.5,
            id: Date.now() + Math.random() + i,
            shape: '⭐',
            color: '#ffeaa7'
          }]);
        }
        ringPhase++;
      }, 900);
      
    } else {
      // Default - Random bullets from sides
      attackInterval = setInterval(() => {
        const side = Math.floor(Math.random() * 4);
        let bullet = { id: Date.now() + Math.random(), shape: '⚪', color: '#fff' };
        
        if (side === 0) {
          bullet.x = Math.random() * 280 + 20;
          bullet.y = -10;
          bullet.dx = 0;
          bullet.dy = 3;
        } else if (side === 1) {
          bullet.x = 320;
          bullet.y = Math.random() * 280 + 20;
          bullet.dx = -3;
          bullet.dy = 0;
        } else if (side === 2) {
          bullet.x = Math.random() * 280 + 20;
          bullet.y = 320;
          bullet.dx = 0;
          bullet.dy = -3;
        } else {
          bullet.x = -10;
          bullet.y = Math.random() * 280 + 20;
          bullet.dx = 3;
          bullet.dy = 0;
        }
        
        setBullets(prev => [...prev, bullet]);
      }, 500);
    }
    
    return () => {
      if (attackInterval) {
        clearInterval(attackInterval);
      }
    };
  }, [inBattle, battlePhase, currentWorld]);

  // Dodge phase timer
  useEffect(() => {
    if (battlePhase === 'dodge' && dodgeTime > 0) {
      // Check if player died
      if (player.health <= 0) {
        setBattleLog(prev => [...prev, '💀 You were defeated...']);
        setTimeout(() => {
          setInBattle(false);
          setEnemy(null);
          setBattleLog([]);
          setBattlePhase('menu');
          setBullets([]);
          setPlayer(prev => ({ ...prev, health: prev.maxHealth }));
        }, 2000);
        return;
      }
      
      const timer = setTimeout(() => {
        setDodgeTime(dodgeTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (battlePhase === 'dodge' && dodgeTime === 0) {
      // End dodge phase
      setBullets([]);
      setBattlePhase('menu');
      setPlayerTurn(true);
      setHeartPosition({ x: 150, y: 150 });
    }
  }, [dodgeTime, battlePhase, player.health]);

  // Attack bar animation
  useEffect(() => {
    if (!attackBarMoving) return;
    
    const interval = setInterval(() => {
      setAttackBarPosition(prev => {
        if (prev >= 300) {
          setAttackBarMoving(false);
          return 0;
        }
        return prev + 4;
      });
    }, 20);
    
    return () => clearInterval(interval);
  }, [attackBarMoving]);

  // Add chat message
  const addChatMessage = (sender, message) => {
    const filtered = filterBadWords(message);
    setChatMessages(prev => [...prev.slice(-50), { sender, message: filtered, time: new Date().toLocaleTimeString() }]);
  };

  // Send chat message
  const sendChatMessage = () => {
    if (chatInput.trim()) {
      addChatMessage(playerName || 'Player', chatInput);
      setChatInput('');
    }
  };

  // Level up
  const levelUp = () => {
    setPlayer(prev => ({
      ...prev,
      level: prev.level + 1,
      statPoints: prev.statPoints + 3,
      xp: 0,
      xpToNext: Math.floor(prev.xpToNext * 1.5)
    }));
    addChatMessage('System', `${playerName} reached level ${player.level + 1}!`);
  };

  // Add stat points with custom input
  const [statInputs, setStatInputs] = useState({ damage: '', speed: '', health: '' });
  
  const addCustomStat = (stat) => {
    const amount = parseInt(statInputs[stat]) || 0;
    if (amount <= 0 || amount > player.statPoints) return;
    
    setPlayer(prev => {
      const updated = { ...prev, statPoints: prev.statPoints - amount };
      if (stat === 'damage') updated.damage += amount * 2;
      if (stat === 'speed') updated.speed += amount * 1;
      if (stat === 'health') {
        updated.maxHealth += amount * 10;
        updated.health += amount * 10;
      }
      return updated;
    });
    
    setStatInputs(prev => ({ ...prev, [stat]: '' }));
  };

  // Start battle
  const startBattle = (isBoss = false) => {
    const worldData = worlds.find(w => w.id === currentWorld);
    const enemyLevel = player.level + Math.floor(Math.random() * 5);
    
    setEnemy({
      name: isBoss ? worldData.boss : `${worldData.name} Enemy`,
      level: enemyLevel,
      health: isBoss ? enemyLevel * 50 : enemyLevel * 20,
      maxHealth: isBoss ? enemyLevel * 50 : enemyLevel * 20,
      damage: isBoss ? enemyLevel * 3 : enemyLevel * 2,
      isBoss
    });
    
    setInBattle(true);
    setBattleLog([`A wild ${isBoss ? worldData.boss : 'enemy'} appeared!`]);
    setPlayerTurn(true);
  };

  // Player attack - Undertale style
  const startAttack = () => {
    setBattlePhase('attack');
    setAttackBarMoving(true);
    setAttackTargetX(Math.random() * 200 + 50);
  };

  const executeAttack = () => {
    if (!attackBarMoving) return;
    
    setAttackBarMoving(false);
    
    // Calculate damage based on how close to target
    const accuracy = Math.abs(attackBarPosition - attackTargetX);
    let damageMultiplier = 1;
    
    if (accuracy < 10) {
      damageMultiplier = 2; // Critical hit!
      setBattleLog(prev => [...prev, '💥 CRITICAL HIT!']);
    } else if (accuracy < 30) {
      damageMultiplier = 1.5;
      setBattleLog(prev => [...prev, '⚔️ Great hit!']);
    } else if (accuracy < 60) {
      damageMultiplier = 1;
      setBattleLog(prev => [...prev, '👍 Hit!']);
    } else {
      damageMultiplier = 0.5;
      setBattleLog(prev => [...prev, '😬 Weak hit...']);
    }
    
    const damage = Math.floor((player.damage + Math.floor(Math.random() * 10)) * damageMultiplier);
    const newEnemyHealth = Math.max(0, enemy.health - damage);
    
    setBattleLog(prev => [...prev, `Dealt ${damage} damage!`]);
    setEnemy(prev => ({ ...prev, health: newEnemyHealth }));
    setAttackBarPosition(0);
    
    setTimeout(() => {
      if (newEnemyHealth <= 0) {
        // Enemy defeated
        const xpGain = enemy.isBoss ? 500 : 50;
        const goldGain = enemy.isBoss ? 200 : 20;
        
        setBattleLog(prev => [...prev, `🎉 Victory! Gained ${xpGain} XP and ${goldGain} gold!`]);
        
        setPlayer(prev => {
          const newXp = prev.xp + xpGain;
          const leveledUp = newXp >= prev.xpToNext;
          return {
            ...prev,
            xp: leveledUp ? newXp - prev.xpToNext : newXp,
            gold: prev.gold + goldGain,
            scrolls: enemy.isBoss ? prev.scrolls + 1 : prev.scrolls
          };
        });
        
        if (enemy.isBoss) {
          setWorlds(prev => {
            const updated = [...prev];
            const currentIndex = updated.findIndex(w => w.id === currentWorld);
            updated[currentIndex].scroll = true;
            if (currentIndex < updated.length - 1) {
              updated[currentIndex + 1].unlocked = true;
            }
            return updated;
          });
          setBattleLog(prev => [...prev, `🎉 You obtained the ${worlds.find(w => w.id === currentWorld).name} Scroll!`]);
        }
        
        setTimeout(() => {
          setInBattle(false);
          setEnemy(null);
          setBattleLog([]);
          setBattlePhase('menu');
          if (player.xp + xpGain >= player.xpToNext) levelUp();
        }, 2000);
      } else {
        // Enemy turn - dodge phase
        setBattlePhase('dodge');
        setPlayerTurn(false);
        setDodgeTime(5);
        setBattleLog(prev => [...prev, `${enemy.name} attacks! DODGE!`]);
        console.log('Starting dodge phase - bullets should spawn now');
      }
    }, 500);
  };

  const spareEnemy = () => {
    const mercyChance = Math.random();
    
    if (mercyChance < 0.5) {
      // 50% chance enemy is spared and runs away
      setBattleLog(prev => [...prev, '❤️ You showed mercy...']);
      setTimeout(() => {
        setBattleLog(prev => [...prev, `${enemy.name} was touched by your kindness and fled!`]);
        setTimeout(() => {
          setInBattle(false);
          setEnemy(null);
          setBattleLog([]);
          setBattlePhase('menu');
        }, 1500);
      }, 1000);
    } else {
      // 50% chance enemy attacks anyway
      setBattleLog(prev => [...prev, '❤️ You showed mercy...']);
      setTimeout(() => {
        setBattleLog(prev => [...prev, `${enemy.name} doesn't accept your mercy and attacks!`]);
        // Enemy turn - dodge phase
        setBattlePhase('dodge');
        setPlayerTurn(false);
        setDodgeTime(5);
      }, 1000);
    }
  };

  // Check victory condition
  const checkVictory = () => {
    return player.scrolls === 7;
  };

  // Admin code verification
  const checkAdminCode = () => {
    if (adminCodeInput === 'charmander165adminpowers') {
      setIsAdmin(true);
      setAdminCodeInput('');
      addChatMessage('System', '🔐 ADMIN ACCESS GRANTED! All powers unlocked!');
      setShowAdminPanel(true);
    } else {
      addChatMessage('System', '❌ Invalid admin code!');
      setAdminCodeInput('');
    }
  };

  // Admin powers
  const adminUnlockAllWorlds = () => {
    setWorlds(prev => prev.map(w => ({ ...w, unlocked: true })));
    addChatMessage('System', '🌍 All worlds unlocked!');
  };

  const adminGiveAllScrolls = () => {
    setPlayer(prev => ({ ...prev, scrolls: 7 }));
    setWorlds(prev => prev.map(w => ({ ...w, scroll: true })));
    addChatMessage('System', '📜 All scrolls obtained!');
  };

  const adminMaxLevel = () => {
    setPlayer(prev => ({ 
      ...prev, 
      level: 1000, 
      xp: 0,
      xpToNext: 999999999,
      statPoints: prev.statPoints + 2997 // 999 levels * 3 points
    }));
    addChatMessage('System', '⭐ Level set to MAX (1000)!');
  };

  const adminGodMode = () => {
    setPlayer(prev => ({
      ...prev,
      health: 999999,
      maxHealth: 999999,
      damage: 9999,
      speed: 999
    }));
    addChatMessage('System', '💪 GOD MODE ACTIVATED!');
  };

  const adminGiveGold = () => {
    setPlayer(prev => ({ ...prev, gold: prev.gold + 100000 }));
    addChatMessage('System', '💰 +100,000 Gold!');
  };

  const adminInstantWin = () => {
    if (inBattle && enemy) {
      setEnemy(prev => ({ ...prev, health: 0 }));
      addChatMessage('System', '⚡ Enemy instantly defeated!');
    }
  };

  const adminGiveStatPoints = () => {
    setPlayer(prev => ({ ...prev, statPoints: prev.statPoints + 1000 }));
    addChatMessage('System', '⭐ +1000 Stat Points!');
  };

  if (!gameStarted) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Press Start 2P", cursive',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        
        <div style={{
          background: '#2c3e50',
          border: '8px solid #000',
          boxShadow: '0 0 0 4px #fff, 0 20px 40px rgba(0,0,0,0.5)',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          imageRendering: 'pixelated'
        }}>
          <h1 style={{
            color: '#ffd700',
            fontSize: '24px',
            marginBottom: '30px',
            textAlign: 'center',
            textShadow: '4px 4px 0 #000'
          }}>
            ⚔️ SCROLL QUEST ⚔️
          </h1>
          
          <div style={{ marginBottom: '30px' }}>
            <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '10px' }}>
              ENTER NAME:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '14px',
                border: '4px solid #000',
                background: '#fff',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              placeholder="HERO"
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '10px' }}>
              CHOOSE CLASS:
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {Object.entries(CLASSES).map(([key, cls]) => (
                <button
                  key={key}
                  onClick={() => setSelectedClass(key)}
                  style={{
                    flex: '1',
                    minWidth: '150px',
                    padding: '20px',
                    fontSize: '10px',
                    background: selectedClass === key ? cls.color : '#34495e',
                    color: '#fff',
                    border: '4px solid #000',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    transform: selectedClass === key ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>{cls.icon}</div>
                  {cls.name}
                  <div style={{ fontSize: '8px', marginTop: '5px', opacity: 0.8 }}>{cls.weapon}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={!playerName || !selectedClass}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '16px',
              background: playerName && selectedClass ? '#27ae60' : '#7f8c8d',
              color: '#fff',
              border: '4px solid #000',
              cursor: playerName && selectedClass ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
          >
            START ADVENTURE!
          </button>
          
          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: '#34495e',
            border: '4px solid #000',
            color: '#fff',
            fontSize: '8px',
            lineHeight: '1.6'
          }}>
            <strong>OBJECTIVE:</strong> Defeat all 7 bosses and collect their scrolls to win!
            <br/><strong>LEVELS:</strong> Max level 1000 • 3 stat points per level
            <br/><strong>WORLDS:</strong> 7 unique realms to explore
            <br/><strong>FEATURES:</strong> PvP • Multiplayer • Chat
          </div>
        </div>
      </div>
    );
  }

  // Main game screen
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#1a1a2e',
      fontFamily: '"Press Start 2P", cursive',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div style={{
        background: '#16213e',
        borderBottom: '4px solid #000',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ color: '#ffd700', fontSize: '14px' }}>
          {playerName} • Lv.{player.level}
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '10px', color: '#fff', flexWrap: 'wrap' }}>
          <span>💰 {player.gold}</span>
          <span>📜 {player.scrolls}/7</span>
          <span style={{ color: player.statPoints > 0 ? '#2ecc71' : '#fff' }}>
            ⭐ {player.statPoints} pts
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '250px',
          background: '#0f3460',
          borderRight: '4px solid #000',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h3 style={{ color: '#fff', fontSize: '10px', marginBottom: '15px' }}>MENU</h3>
          
          <button
            onClick={() => setScreen('game')}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              background: screen === 'game' ? '#e74c3c' : '#34495e',
              color: '#fff',
              border: '3px solid #000',
              fontSize: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            🗺️ EXPLORE
          </button>

          <button
            onClick={() => setScreen('worldSelect')}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              background: screen === 'worldSelect' ? '#e74c3c' : '#34495e',
              color: '#fff',
              border: '3px solid #000',
              fontSize: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            🌍 WORLDS
          </button>

          <button
            onClick={() => setScreen('pvp')}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              background: screen === 'pvp' ? '#e74c3c' : '#34495e',
              color: '#fff',
              border: '3px solid #000',
              fontSize: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            ⚔️ PVP ARENA
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              background: showChat ? '#e74c3c' : '#34495e',
              color: '#fff',
              border: '3px solid #000',
              fontSize: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            💬 CHAT
          </button>

          {/* Admin Panel Toggle */}
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              background: showAdminPanel ? '#9b59b6' : '#34495e',
              color: '#fff',
              border: '3px solid #000',
              fontSize: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              position: 'relative'
            }}
          >
            🔐 ADMIN
            {isAdmin && (
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '8px',
                height: '8px',
                background: '#2ecc71',
                borderRadius: '50%',
                border: '1px solid #000'
              }} />
            )}
          </button>

          {/* Stats */}
          <div style={{
            background: '#16213e',
            border: '3px solid #000',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <h4 style={{ color: '#ffd700', fontSize: '9px', marginBottom: '10px' }}>STATS</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#fff', fontSize: '8px', marginBottom: '5px' }}>
                HP: {player.health}/{player.maxHealth}
              </div>
              <div style={{
                background: '#000',
                height: '15px',
                border: '2px solid #fff',
                position: 'relative'
              }}>
                <div style={{
                  background: '#e74c3c',
                  height: '100%',
                  width: `${(player.health / player.maxHealth) * 100}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#fff', fontSize: '8px', marginBottom: '5px' }}>
                XP: {player.xp}/{player.xpToNext}
              </div>
              <div style={{
                background: '#000',
                height: '15px',
                border: '2px solid #fff',
                position: 'relative'
              }}>
                <div style={{
                  background: '#3498db',
                  height: '100%',
                  width: `${(player.xp / player.xpToNext) * 100}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>

            <div style={{ color: '#fff', fontSize: '8px', lineHeight: '1.8' }}>
              ⚔️ DMG: {player.damage}
              <br />
              ⚡ SPD: {player.speed}
            </div>
          </div>

          {/* Stat points */}
          {player.statPoints > 0 && (
            <div style={{
              background: '#27ae60',
              border: '3px solid #000',
              padding: '15px'
            }}>
              <h4 style={{ color: '#fff', fontSize: '9px', marginBottom: '10px' }}>
                STAT POINTS: {player.statPoints}
              </h4>
              
              {/* Damage */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#fff', fontSize: '7px', marginBottom: '5px' }}>
                  ⚔️ DAMAGE (+2 per point)
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="number"
                    min="1"
                    max={player.statPoints}
                    value={statInputs.damage}
                    onChange={(e) => setStatInputs(prev => ({ ...prev, damage: e.target.value }))}
                    placeholder="Amount"
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#fff',
                      border: '2px solid #000',
                      fontSize: '7px',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    onClick={() => addCustomStat('damage')}
                    style={{
                      padding: '6px 12px',
                      background: '#e74c3c',
                      color: '#fff',
                      border: '2px solid #000',
                      fontSize: '7px',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    ADD
                  </button>
                </div>
              </div>
              
              {/* Speed */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#fff', fontSize: '7px', marginBottom: '5px' }}>
                  ⚡ SPEED (+1 per point)
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="number"
                    min="1"
                    max={player.statPoints}
                    value={statInputs.speed}
                    onChange={(e) => setStatInputs(prev => ({ ...prev, speed: e.target.value }))}
                    placeholder="Amount"
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#fff',
                      border: '2px solid #000',
                      fontSize: '7px',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    onClick={() => addCustomStat('speed')}
                    style={{
                      padding: '6px 12px',
                      background: '#f39c12',
                      color: '#fff',
                      border: '2px solid #000',
                      fontSize: '7px',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    ADD
                  </button>
                </div>
              </div>
              
              {/* Health */}
              <div>
                <div style={{ color: '#fff', fontSize: '7px', marginBottom: '5px' }}>
                  ❤️ HEALTH (+10 per point)
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="number"
                    min="1"
                    max={player.statPoints}
                    value={statInputs.health}
                    onChange={(e) => setStatInputs(prev => ({ ...prev, health: e.target.value }))}
                    placeholder="Amount"
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#fff',
                      border: '2px solid #000',
                      fontSize: '7px',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    onClick={() => addCustomStat('health')}
                    style={{
                      padding: '6px 12px',
                      background: '#2ecc71',
                      color: '#fff',
                      border: '2px solid #000',
                      fontSize: '7px',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    ADD
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {screen === 'worldSelect' && (
              <div>
                <h2 style={{ color: '#ffd700', fontSize: '16px', marginBottom: '20px' }}>
                  🌍 WORLD PORTALS
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '15px'
                }}>
                  {worlds.map((world) => (
                    <div
                      key={world.id}
                      onClick={() => {
                        if (world.unlocked) {
                          setCurrentWorld(world.id);
                          setScreen('game');
                        }
                      }}
                      style={{
                        background: world.unlocked ? world.color : '#2c3e50',
                        border: '4px solid #000',
                        padding: '20px',
                        cursor: world.unlocked ? 'pointer' : 'not-allowed',
                        opacity: world.unlocked ? 1 : 0.5,
                        position: 'relative',
                        transition: 'transform 0.2s',
                        transform: currentWorld === world.id ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>{world.icon}</div>
                      <div style={{ color: '#fff', fontSize: '10px', marginBottom: '5px' }}>
                        {world.name}
                      </div>
                      <div style={{ color: '#fff', fontSize: '7px', marginBottom: '10px' }}>
                        Boss: {world.boss}
                      </div>
                      {world.scroll && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          fontSize: '20px'
                        }}>
                          📜
                        </div>
                      )}
                      {!world.unlocked && (
                        <div style={{
                          color: '#e74c3c',
                          fontSize: '8px',
                          marginTop: '10px'
                        }}>
                          🔒 LOCKED
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {checkVictory() && (
                  <div style={{
                    marginTop: '30px',
                    background: '#ffd700',
                    border: '4px solid #000',
                    padding: '30px',
                    textAlign: 'center'
                  }}>
                    <h2 style={{ fontSize: '20px', color: '#000', marginBottom: '15px' }}>
                      🎉 VICTORY! 🎉
                    </h2>
                    <p style={{ fontSize: '10px', color: '#000' }}>
                      You collected all 7 scrolls and saved the realm!
                    </p>
                  </div>
                )}
              </div>
            )}

            {screen === 'game' && (
              <div>
                {!inBattle ? (
                  <div>
                    <h2 style={{ color: '#ffd700', fontSize: '16px', marginBottom: '20px' }}>
                      {worlds.find(w => w.id === currentWorld).icon} {worlds.find(w => w.id === currentWorld).name}
                    </h2>
                    
                    <div style={{
                      background: worlds.find(w => w.id === currentWorld).color,
                      border: '4px solid #000',
                      padding: '40px',
                      marginBottom: '20px',
                      minHeight: '300px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '64px',
                        marginBottom: '20px',
                        animation: 'float 3s ease-in-out infinite'
                      }}>
                        {worlds.find(w => w.id === currentWorld).icon}
                      </div>
                      <p style={{ color: '#fff', fontSize: '10px', textAlign: 'center', marginBottom: '30px' }}>
                        Explore the {worlds.find(w => w.id === currentWorld).name} and face its challenges!
                      </p>
                      
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                          onClick={() => startBattle(false)}
                          style={{
                            padding: '15px 30px',
                            background: '#e74c3c',
                            color: '#fff',
                            border: '3px solid #000',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          ⚔️ BATTLE
                        </button>
                        
                        <button
                          onClick={() => startBattle(true)}
                          style={{
                            padding: '15px 30px',
                            background: '#8e44ad',
                            color: '#fff',
                            border: '3px solid #000',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          👑 BOSS FIGHT
                        </button>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div style={{
                      background: '#16213e',
                      border: '4px solid #000',
                      padding: '20px'
                    }}>
                      <h3 style={{ color: '#ffd700', fontSize: '12px', marginBottom: '15px' }}>
                        📋 DAILY TASKS
                      </h3>
                      {TASKS.map(task => (
                        <div
                          key={task.id}
                          style={{
                            background: '#0f3460',
                            border: '2px solid #000',
                            padding: '10px',
                            marginBottom: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ color: '#fff', fontSize: '8px' }}>{task.name}</span>
                          <span style={{ color: '#ffd700', fontSize: '8px' }}>
                            {task.xp} XP • {task.reward} 💰
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Battle screen - Undertale style
                  <div>
                    <h2 style={{ color: '#e74c3c', fontSize: '16px', marginBottom: '20px' }}>
                      ⚔️ BATTLE!
                    </h2>

                    {/* Enemy */}
                    <div style={{
                      background: '#000',
                      border: '4px solid #fff',
                      padding: '30px',
                      marginBottom: '20px',
                      textAlign: 'center',
                      minHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '64px', 
                        marginBottom: '15px',
                        animation: battlePhase === 'dodge' ? 'shake 0.5s infinite' : 'none'
                      }}>
                        {enemy.isBoss ? '👹' : '👾'}
                      </div>
                      <div style={{ color: '#fff', fontSize: '12px', marginBottom: '10px' }}>
                        {enemy.name} LV.{enemy.level}
                      </div>
                      <div style={{
                        background: '#2c3e50',
                        height: '20px',
                        border: '2px solid #fff',
                        maxWidth: '300px',
                        margin: '0 auto',
                        width: '100%'
                      }}>
                        <div style={{
                          background: '#27ae60',
                          height: '100%',
                          width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <div style={{ color: '#fff', fontSize: '8px', marginTop: '5px' }}>
                        HP: {enemy.health}/{enemy.maxHealth}
                      </div>
                    </div>

                    {/* Battle phases */}
                    {battlePhase === 'menu' && (
                      <div>
                        {/* Battle log */}
                        <div style={{
                          background: '#000',
                          border: '4px solid #fff',
                          padding: '20px',
                          marginBottom: '20px',
                          minHeight: '100px',
                          maxHeight: '150px',
                          overflowY: 'auto'
                        }}>
                          {battleLog.slice(-5).map((log, i) => (
                            <div key={i} style={{ color: '#fff', fontSize: '10px', marginBottom: '8px', lineHeight: '1.4' }}>
                              * {log}
                            </div>
                          ))}
                        </div>

                        {/* Action menu */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '15px',
                          maxWidth: '500px',
                          margin: '0 auto'
                        }}>
                          <button
                            onClick={startAttack}
                            style={{
                              padding: '25px',
                              background: '#e74c3c',
                              color: '#fff',
                              border: '4px solid #fff',
                              fontSize: '14px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              boxShadow: '0 4px 0 #c0392b'
                            }}
                          >
                            ⚔️ FIGHT
                          </button>
                          <button
                            onClick={spareEnemy}
                            style={{
                              padding: '25px',
                              background: '#f39c12',
                              color: '#fff',
                              border: '4px solid #fff',
                              fontSize: '14px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              boxShadow: '0 4px 0 #d68910'
                            }}
                          >
                            💛 MERCY
                          </button>
                        </div>
                      </div>
                    )}

                    {battlePhase === 'attack' && (
                      <div>
                        <div style={{
                          background: '#000',
                          border: '4px solid #fff',
                          padding: '20px',
                          marginBottom: '20px',
                          textAlign: 'center'
                        }}>
                          <p style={{ color: '#fff', fontSize: '10px', marginBottom: '20px' }}>
                            Press SPACE when the bar reaches the target!
                          </p>
                          
                          {/* Attack bar */}
                          <div style={{
                            position: 'relative',
                            height: '60px',
                            background: '#2c3e50',
                            border: '3px solid #fff',
                            margin: '0 auto',
                            maxWidth: '400px'
                          }}>
                            {/* Target zone */}
                            <div style={{
                              position: 'absolute',
                              left: `${attackTargetX}px`,
                              top: '0',
                              width: '20px',
                              height: '100%',
                              background: '#f39c12',
                              border: '2px solid #fff'
                            }} />
                            
                            {/* Moving bar */}
                            {attackBarMoving && (
                              <div style={{
                                position: 'absolute',
                                left: `${attackBarPosition}px`,
                                top: '0',
                                width: '8px',
                                height: '100%',
                                background: '#e74c3c',
                                border: '2px solid #fff'
                              }} />
                            )}
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <button
                            onClick={executeAttack}
                            disabled={!attackBarMoving}
                            style={{
                              padding: '20px 50px',
                              background: attackBarMoving ? '#27ae60' : '#7f8c8d',
                              color: '#fff',
                              border: '4px solid #fff',
                              fontSize: '14px',
                              cursor: attackBarMoving ? 'pointer' : 'not-allowed',
                              fontFamily: 'inherit',
                              boxShadow: attackBarMoving ? '0 4px 0 #1e8449' : 'none'
                            }}
                          >
                            [SPACE] ATTACK!
                          </button>
                        </div>
                      </div>
                    )}

                    {battlePhase === 'dodge' && (
                      <div>
                        <div style={{
                          background: '#000',
                          border: '4px solid #fff',
                          padding: '20px',
                          marginBottom: '15px',
                          textAlign: 'center'
                        }}>
                          <p style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '10px' }}>
                            ⚠️ DODGE THE BULLETS! ⚠️
                          </p>
                          <p style={{ color: '#fff', fontSize: '10px', marginBottom: '10px' }}>
                            Use WASD or Arrow Keys to move
                          </p>
                          <p style={{ color: '#ffd700', fontSize: '14px' }}>
                            Time remaining: {dodgeTime}s
                          </p>
                        </div>

                        {/* Dodge box */}
                        <div style={{
                          position: 'relative',
                          width: '320px',
                          height: '320px',
                          background: '#000',
                          border: '6px solid #fff',
                          margin: '0 auto',
                          overflow: 'hidden'
                        }}>
                          {/* Player heart */}
                          <div style={{
                            position: 'absolute',
                            left: `${heartPosition.x - 12}px`,
                            top: `${heartPosition.y - 12}px`,
                            width: '24px',
                            height: '24px',
                            fontSize: '24px',
                            lineHeight: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            filter: 'drop-shadow(0 0 4px rgba(255, 0, 0, 0.8))',
                            transition: 'none',
                            userSelect: 'none',
                            zIndex: 10
                          }}>
                            ❤️
                          </div>

                          {/* Bullets */}
                          {bullets.map(bullet => (
                            <div
                              key={bullet.id}
                              style={{
                                position: 'absolute',
                                left: `${bullet.x - 12}px`,
                                top: `${bullet.y - 12}px`,
                                width: '24px',
                                height: '24px',
                                fontSize: '24px',
                                lineHeight: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                filter: `drop-shadow(0 0 6px ${bullet.color || '#fff'})`,
                                userSelect: 'none',
                                border: '3px solid #fff',
                                background: 'rgba(255, 255, 255, 0.3)',
                                borderRadius: '50%',
                                zIndex: 100
                              }}
                            >
                              {bullet.shape || '⚪'}
                            </div>
                          ))}
                        </div>

                        {/* Player health during dodge */}
                        <div style={{
                          marginTop: '15px',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            background: '#000',
                            border: '3px solid #fff',
                            padding: '10px',
                            display: 'inline-block'
                          }}>
                            <div style={{ color: '#fff', fontSize: '8px', marginBottom: '5px' }}>
                              YOUR HP: {player.health}/{player.maxHealth}
                            </div>
                            <div style={{
                              background: '#2c3e50',
                              height: '15px',
                              width: '200px',
                              border: '2px solid #fff'
                            }}>
                              <div style={{
                                background: '#e74c3c',
                                height: '100%',
                                width: `${(player.health / player.maxHealth) * 100}%`,
                                transition: 'width 0.3s'
                              }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {screen === 'pvp' && (
              <div>
                <h2 style={{ color: '#ffd700', fontSize: '16px', marginBottom: '20px' }}>
                  ⚔️ PVP BATTLEFIELD
                </h2>
                <div style={{
                  background: '#e74c3c',
                  border: '4px solid #000',
                  padding: '60px',
                  textAlign: 'center',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚔️</div>
                  <p style={{ color: '#fff', fontSize: '12px', marginBottom: '30px' }}>
                    Challenge other players in epic duels!
                  </p>
                  <button
                    onClick={() => addChatMessage('System', `${playerName} is looking for a PvP match!`)}
                    style={{
                      padding: '20px 40px',
                      background: '#8e44ad',
                      color: '#fff',
                      border: '4px solid #000',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    FIND MATCH
                  </button>
                  <p style={{ color: '#fff', fontSize: '8px', marginTop: '30px', opacity: 0.7 }}>
                    (Multiplayer matchmaking system coming soon!)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          {showChat && (
            <div style={{
              background: '#16213e',
              borderTop: '4px solid #000',
              height: '250px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ fontSize: '8px', color: '#fff' }}>
                    <span style={{ color: '#ffd700' }}>[{msg.time}]</span>{' '}
                    <span style={{ color: msg.sender === 'System' ? '#3498db' : '#fff' }}>
                      {msg.sender}:
                    </span>{' '}
                    {msg.message}
                  </div>
                ))}
              </div>
              <div style={{ padding: '15px', borderTop: '2px solid #0f3460', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type message..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#0f3460',
                    border: '2px solid #000',
                    color: '#fff',
                    fontSize: '8px',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  onClick={sendChatMessage}
                  style={{
                    padding: '10px 20px',
                    background: '#27ae60',
                    color: '#fff',
                    border: '2px solid #000',
                    fontSize: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  SEND
                </button>
              </div>
            </div>
          )}

          {/* Admin Panel */}
          {showAdminPanel && (
            <div style={{
              background: '#2c3e50',
              borderTop: '4px solid #000',
              padding: '20px'
            }}>
              <h3 style={{ color: '#9b59b6', fontSize: '10px', marginBottom: '15px' }}>
                🔐 ADMIN PANEL
              </h3>
              
              {!isAdmin ? (
                <div>
                  <p style={{ color: '#fff', fontSize: '8px', marginBottom: '10px' }}>
                    Enter admin code:
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="password"
                      value={adminCodeInput}
                      onChange={(e) => setAdminCodeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && checkAdminCode()}
                      placeholder="Admin code..."
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#34495e',
                        border: '2px solid #000',
                        color: '#fff',
                        fontSize: '8px',
                        fontFamily: 'inherit'
                      }}
                    />
                    <button
                      onClick={checkAdminCode}
                      style={{
                        padding: '10px 20px',
                        background: '#9b59b6',
                        color: '#fff',
                        border: '2px solid #000',
                        fontSize: '8px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      SUBMIT
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    background: '#2ecc71',
                    border: '2px solid #000',
                    padding: '10px',
                    marginBottom: '15px',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: '#000', fontSize: '8px', fontWeight: 'bold' }}>
                      ✅ ADMIN ACCESS GRANTED
                    </p>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <button
                      onClick={adminUnlockAllWorlds}
                      style={{
                        padding: '10px',
                        background: '#3498db',
                        color: '#fff',
                        border: '2px solid #000',
                        fontSize: '7px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      🌍 UNLOCK ALL WORLDS
                    </button>
                    
                    <button
                      onClick={adminGiveAllScrolls}
                      style={{
                        padding: '10px',
                        background: '#f39c12',
                        color: '#fff',
                        border: '2px solid #000',
                        fontSize: '7px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      📜 GIVE ALL SCROLLS
                    </button>
                    
                    <button
                      onClick={adminMaxLevel}
                      style={{
                        padding: '10px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: '2px solid #000',
                        fontSize: '7px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      ⭐ MAX LEVEL (1000)
                    </button>
                    
                    <button
                      onClick={adminGodMode}
                      style={{
                        padding: '10px',
                        background: '#9b59b6',
                        color: '#fff',
                        border: '2px solid #000',
                        fontSize: '7px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      💪 GOD MODE
                    </button>
                    
                    <button
                      onClick={adminGiveGold}
                      style={{
                        padding: '10px',
                        background: '#f1c40f',
                        color: '#000',
                        border: '2px solid #000',
                        fontSize: '7px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 'bold'
                      }}
                    >
                      💰 +100,000 GOLD
                    </button>
                    
                    <button
                      onClick={adminGiveStatPoints}
                      style={{
                        padding: '10px',
                        background: '#16a085',
                        color: '#fff',
                        border: '2px solid #000',
                        fontSize: '7px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      ⭐ +1000 STAT POINTS
                    </button>
                    
                    {inBattle && (
                      <button
                        onClick={adminInstantWin}
                        style={{
                          padding: '10px',
                          background: '#1abc9c',
                          color: '#fff',
                          border: '2px solid #000',
                          fontSize: '7px',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        ⚡ INSTANT WIN BATTLE
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        ::-webkit-scrollbar {
          width: 12px;
        }
        
        ::-webkit-scrollbar-track {
          background: #0f3460;
          border: 2px solid #000;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #e74c3c;
          border: 2px solid #000;
        }
      `}</style>
    </div>
  );
}
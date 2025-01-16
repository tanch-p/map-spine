<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import * as spine from "$lib/spine";
  import config from "$lib/data/level_rogue4_1-1.json";
  import { Game } from "./objects/Game";

  let canvasElement: HTMLCanvasElement;
  const enemies = [
    {
      useDb: true,
      id: "enemy_2001_duckmi",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2002_bearmi",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2034_sythef",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2085_skzjxd",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_1000_gopro",
      level: 0,
      overwrittenData: {
        name: {
          m_defined: false,
          m_value: null,
        },
        description: {
          m_defined: false,
          m_value: null,
        },
        prefabKey: {
          m_defined: false,
          m_value: null,
        },
        attributes: {
          maxHp: {
            m_defined: false,
            m_value: 0,
          },
          atk: {
            m_defined: true,
            m_value: 150,
          },
          def: {
            m_defined: false,
            m_value: 0,
          },
          magicResistance: {
            m_defined: false,
            m_value: 0.0,
          },
          cost: {
            m_defined: false,
            m_value: 0,
          },
          blockCnt: {
            m_defined: false,
            m_value: 0,
          },
          moveSpeed: {
            m_defined: false,
            m_value: 0.0,
          },
          attackSpeed: {
            m_defined: false,
            m_value: 0.0,
          },
          baseAttackTime: {
            m_defined: false,
            m_value: 0.0,
          },
          respawnTime: {
            m_defined: false,
            m_value: 0,
          },
          hpRecoveryPerSec: {
            m_defined: false,
            m_value: 0.0,
          },
          spRecoveryPerSec: {
            m_defined: false,
            m_value: 0.0,
          },
          maxDeployCount: {
            m_defined: false,
            m_value: 0,
          },
          massLevel: {
            m_defined: false,
            m_value: 0,
          },
          baseForceLevel: {
            m_defined: false,
            m_value: 0,
          },
          tauntLevel: {
            m_defined: false,
            m_value: 0,
          },
          epDamageResistance: {
            m_defined: false,
            m_value: 0.0,
          },
          epResistance: {
            m_defined: false,
            m_value: 0.0,
          },
          damageHitratePhysical: {
            m_defined: false,
            m_value: 0.0,
          },
          damageHitrateMagical: {
            m_defined: false,
            m_value: 0.0,
          },
          stunImmune: {
            m_defined: false,
            m_value: false,
          },
          silenceImmune: {
            m_defined: false,
            m_value: false,
          },
          sleepImmune: {
            m_defined: false,
            m_value: false,
          },
          frozenImmune: {
            m_defined: false,
            m_value: false,
          },
          levitateImmune: {
            m_defined: false,
            m_value: false,
          },
          disarmedCombatImmune: {
            m_defined: false,
            m_value: false,
          },
          fearedImmune: {
            m_defined: false,
            m_value: false,
          },
        },
        applyWay: {
          m_defined: false,
          m_value: "NONE",
        },
        motion: {
          m_defined: false,
          m_value: "WALK",
        },
        enemyTags: {
          m_defined: false,
          m_value: null,
        },
        lifePointReduce: {
          m_defined: false,
          m_value: 0,
        },
        levelType: {
          m_defined: false,
          m_value: "NORMAL",
        },
        rangeRadius: {
          m_defined: false,
          m_value: 0.0,
        },
        numOfExtraDrops: {
          m_defined: false,
          m_value: 0,
        },
        viewRadius: {
          m_defined: false,
          m_value: 0.0,
        },
        notCountInTotal: {
          m_defined: false,
          m_value: false,
        },
        talentBlackboard: null,
        skills: null,
        spData: null,
      },
    },
    {
      useDb: true,
      id: "enemy_2086_skzdwx",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2087_skzdwy",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2088_skzdwz",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_1243_ltswar",
      level: 0,
      overwrittenData: {
        name: {
          m_defined: false,
          m_value: null,
        },
        description: {
          m_defined: false,
          m_value: null,
        },
        prefabKey: {
          m_defined: false,
          m_value: null,
        },
        attributes: {
          maxHp: {
            m_defined: true,
            m_value: 8000,
          },
          atk: {
            m_defined: true,
            m_value: 650,
          },
          def: {
            m_defined: true,
            m_value: 200,
          },
          magicResistance: {
            m_defined: false,
            m_value: 0.0,
          },
          cost: {
            m_defined: false,
            m_value: 0,
          },
          blockCnt: {
            m_defined: false,
            m_value: 0,
          },
          moveSpeed: {
            m_defined: false,
            m_value: 0.0,
          },
          attackSpeed: {
            m_defined: false,
            m_value: 0.0,
          },
          baseAttackTime: {
            m_defined: false,
            m_value: 0.0,
          },
          respawnTime: {
            m_defined: false,
            m_value: 0,
          },
          hpRecoveryPerSec: {
            m_defined: false,
            m_value: 0.0,
          },
          spRecoveryPerSec: {
            m_defined: false,
            m_value: 0.0,
          },
          maxDeployCount: {
            m_defined: false,
            m_value: 0,
          },
          massLevel: {
            m_defined: false,
            m_value: 0,
          },
          baseForceLevel: {
            m_defined: false,
            m_value: 0,
          },
          tauntLevel: {
            m_defined: false,
            m_value: 0,
          },
          epDamageResistance: {
            m_defined: false,
            m_value: 0.0,
          },
          epResistance: {
            m_defined: false,
            m_value: 0.0,
          },
          damageHitratePhysical: {
            m_defined: false,
            m_value: 0.0,
          },
          damageHitrateMagical: {
            m_defined: false,
            m_value: 0.0,
          },
          stunImmune: {
            m_defined: false,
            m_value: false,
          },
          silenceImmune: {
            m_defined: false,
            m_value: false,
          },
          sleepImmune: {
            m_defined: false,
            m_value: false,
          },
          frozenImmune: {
            m_defined: false,
            m_value: false,
          },
          levitateImmune: {
            m_defined: false,
            m_value: false,
          },
          disarmedCombatImmune: {
            m_defined: false,
            m_value: false,
          },
          fearedImmune: {
            m_defined: false,
            m_value: false,
          },
        },
        applyWay: {
          m_defined: false,
          m_value: "NONE",
        },
        motion: {
          m_defined: false,
          m_value: "WALK",
        },
        enemyTags: {
          m_defined: false,
          m_value: null,
        },
        lifePointReduce: {
          m_defined: false,
          m_value: 0,
        },
        levelType: {
          m_defined: false,
          m_value: "NORMAL",
        },
        rangeRadius: {
          m_defined: false,
          m_value: 0.0,
        },
        numOfExtraDrops: {
          m_defined: false,
          m_value: 0,
        },
        viewRadius: {
          m_defined: false,
          m_value: 0.0,
        },
        notCountInTotal: {
          m_defined: false,
          m_value: false,
        },
        talentBlackboard: null,
        skills: null,
        spData: null,
      },
    },
    {
      useDb: true,
      id: "enemy_1071_dftman",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_1012_dcross",
      level: 0,
      overwrittenData: {
        name: {
          m_defined: false,
          m_value: null,
        },
        description: {
          m_defined: false,
          m_value: null,
        },
        prefabKey: {
          m_defined: false,
          m_value: null,
        },
        attributes: {
          maxHp: {
            m_defined: true,
            m_value: 5000,
          },
          atk: {
            m_defined: true,
            m_value: 350,
          },
          def: {
            m_defined: true,
            m_value: 100,
          },
          magicResistance: {
            m_defined: false,
            m_value: 0.0,
          },
          cost: {
            m_defined: false,
            m_value: 0,
          },
          blockCnt: {
            m_defined: false,
            m_value: 0,
          },
          moveSpeed: {
            m_defined: false,
            m_value: 0.0,
          },
          attackSpeed: {
            m_defined: false,
            m_value: 0.0,
          },
          baseAttackTime: {
            m_defined: false,
            m_value: 0.0,
          },
          respawnTime: {
            m_defined: false,
            m_value: 0,
          },
          hpRecoveryPerSec: {
            m_defined: false,
            m_value: 0.0,
          },
          spRecoveryPerSec: {
            m_defined: false,
            m_value: 0.0,
          },
          maxDeployCount: {
            m_defined: false,
            m_value: 0,
          },
          massLevel: {
            m_defined: false,
            m_value: 0,
          },
          baseForceLevel: {
            m_defined: false,
            m_value: 0,
          },
          tauntLevel: {
            m_defined: false,
            m_value: 0,
          },
          epDamageResistance: {
            m_defined: false,
            m_value: 0.0,
          },
          epResistance: {
            m_defined: false,
            m_value: 0.0,
          },
          damageHitratePhysical: {
            m_defined: false,
            m_value: 0.0,
          },
          damageHitrateMagical: {
            m_defined: false,
            m_value: 0.0,
          },
          stunImmune: {
            m_defined: false,
            m_value: false,
          },
          silenceImmune: {
            m_defined: false,
            m_value: false,
          },
          sleepImmune: {
            m_defined: false,
            m_value: false,
          },
          frozenImmune: {
            m_defined: false,
            m_value: false,
          },
          levitateImmune: {
            m_defined: false,
            m_value: false,
          },
          disarmedCombatImmune: {
            m_defined: false,
            m_value: false,
          },
          fearedImmune: {
            m_defined: false,
            m_value: false,
          },
        },
        applyWay: {
          m_defined: false,
          m_value: "NONE",
        },
        motion: {
          m_defined: false,
          m_value: "WALK",
        },
        enemyTags: {
          m_defined: false,
          m_value: null,
        },
        lifePointReduce: {
          m_defined: false,
          m_value: 0,
        },
        levelType: {
          m_defined: false,
          m_value: "NORMAL",
        },
        rangeRadius: {
          m_defined: false,
          m_value: 0.0,
        },
        numOfExtraDrops: {
          m_defined: false,
          m_value: 0,
        },
        viewRadius: {
          m_defined: false,
          m_value: 0.0,
        },
        notCountInTotal: {
          m_defined: false,
          m_value: false,
        },
        talentBlackboard: null,
        skills: null,
        spData: null,
      },
    },
    {
      useDb: true,
      id: "enemy_2069_skzbox",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2067_skzcy",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2065_skzjs",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2091_skzgds",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2070_skzfbx",
      level: 0,
      overwrittenData: null,
    },
    {
      useDb: true,
      id: "enemy_2093_skzams",
      level: 0,
      overwrittenData: null,
    },
  ];
  onMount(() => {
    const game = new Game(config, enemies, canvasElement);
  });
</script>

<canvas bind:this={canvasElement}></canvas>

<style>
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    margin: 0 auto;
  }
</style>

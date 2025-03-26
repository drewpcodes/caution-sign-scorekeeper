import { createStore, produce } from 'solid-js/store';
import {
  createContext,
  createMemo,
  ParentComponent,
  ParentProps,
  useContext,
} from 'solid-js';

const defaultRoundTime = 60;

export type CurrentRound = { number: number };
export type RoundTimer = {
  time: number;
  interval?: ReturnType<typeof window.setInterval>;
};

export type PlayerName = string;

export type RoundPlayer = Record<PlayerName, number>;

export type RoundState = {
  players: RoundPlayer;
  guesser: PlayerName;
};

export type Game = {
  /**
   * current round, round number is zero based
   */
  currentRound: CurrentRound & RoundTimer;
  rounds: RoundState[];
};

export type GameOps = {
  addNewPlayer: (name: PlayerName) => void;
  resetGame: () => void;
  setScore: (name: PlayerName, score: number) => void;
  setGuesser: (name: PlayerName) => void;
  startRound: () => void;
  pauseRound: () => void;
  nextRound: () => void;
  currentRound: () => RoundState | undefined;
};

const defaultGame = {
  currentRound: { number: 0, time: defaultRoundTime },
  rounds: [{ players: {}, guesser: '' }],
};

export const GameContext = createContext<[Game, GameOps]>(undefined);

export const GameProvider: ParentComponent = (props: ParentProps) => {
  const [game, setGame] = createStore<Game>({ ...defaultGame });
  const [rounds, setRounds] = createStore<RoundState[]>(game.rounds);

  const addNewPlayer = (name: PlayerName) => {
    if (
      game.currentRound.number >
      0 /* TODO: Add config option to add players to later rounds */
    ) {
      throw new Error("Game already started, can't add new players");
    }
    setRounds(
      game.currentRound.number,
      produce((round) => {
        round.players[name] = 0;
      }),
    );
  };

  const resetGame = () => {
    setGame({ ...defaultGame, rounds });
  };

  const assertValidPlayer = (name: PlayerName) => {
    if (
      !name ||
      !Object.hasOwn(rounds[game.currentRound.number]?.players, name)
    ) {
      throw new Error('Invalid player');
    }
  };

  const setScore = (name: PlayerName, score: number) => {
    assertValidPlayer(name);
    setRounds(
      game.currentRound.number,
      produce((round) => {
        round.players[name] = score;
      }),
    );
  };

  const setGuesser = (name: PlayerName) => {
    assertValidPlayer(name);
    setRounds(game.currentRound.number, 'guesser', name);
  };

  const clearRoundTimer = (round: RoundTimer) => {
    clearInterval(round.interval);
  };

  const decrementRoundTime = () => {
    const newTime = Math.max(game.currentRound.time - 1, 0);
    setGame(
      'currentRound',
      produce((round) => {
        round.time = newTime;
        if (newTime < 1) {
          clearRoundTimer(round);
        }
      }),
    );
    // TODO: Will we handle derived state for side-effects based on currentRound.time?
  };

  const startRound = () => {
    if (game.currentRound.time < 1) {
      // TODO: Throw err?
      return;
    }
    setGame(
      'currentRound',
      produce((round) => {
        clearRoundTimer(round);
        round.interval = setInterval(decrementRoundTime, 1000);
      }),
    );
  };

  const nextRound = () => {
    // TODO: Configure max rounds or other end condition?
    setGame(
      'currentRound',
      produce((round) => {
        clearRoundTimer(round);
        round.number += 1;
        round.time = defaultRoundTime;
      }),
    );
  };

  const pauseRound = () => {
    setGame(
      'currentRound',
      produce((round) => {
        clearRoundTimer(round);
      }),
    );
  };

  const currentRound = createMemo(() => rounds[game.currentRound.number]);

  const context: [Game, GameOps] = [
    game,
    {
      addNewPlayer,
      resetGame,
      setScore,
      setGuesser,
      startRound,
      pauseRound,
      nextRound,
      currentRound,
    },
  ];

  return (
    <GameContext.Provider value={context}>
      {props.children}
    </GameContext.Provider>
  );
};

export function useGame() {
  const value = useContext(GameContext);

  if (value === undefined) {
    throw new Error('Missing game context Provider');
  }

  return value;
}

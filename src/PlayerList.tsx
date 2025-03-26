import { Component, createMemo, For } from 'solid-js';
import { useGame } from './Game';
import PlayerItem from './PlayerItem';

const PlayerList: Component = () => {
  const [, { currentRound }] = useGame();

  const players = createMemo(() => Object.keys(currentRound()?.players ?? {}));

  return <For each={players()}>{(name) => <PlayerItem name={name} />}</For>;
};

export default PlayerList;

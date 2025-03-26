import { JSX } from 'solid-js';
import { PlayerName } from './Game';

export default function PlayerItem(props: { name: PlayerName }): JSX.Element {
  return (
    <>
      <div>{props.name}</div>
    </>
  );
}

/**
 * @module QRKanji
 * @author nuintun
 * @author Kazuhiko Arase
 * @description SJIS only
 */

import Mode from './Mode';
import QRData from './QRData';
import BitBuffer from './BitBuffer';
import stringToBytes from '../encoding/SJIS';

function createCharError(index: number) {
  return `illegal char at ${index + 1}`;
}

export class QRKanji extends QRData {
  constructor(data: string) {
    super(Mode.Kanji, data);
  }

  public write(buffer: BitBuffer): void {
    let i: number = 0;
    const data: number[] = stringToBytes(this.getData());
    const length: number = data.length;

    while (i + 1 < length) {
      let c: number = ((0xff & data[i]) << 8) | (0xff & data[i + 1]);

      if (0x8140 <= c && c <= 0x9ffc) {
        c -= 0x8140;
      } else if (0xe040 <= c && c <= 0xebbf) {
        c -= 0xc140;
      } else {
        throw `${createCharError(i)} / ${c}`;
      }

      c = ((c >>> 8) & 0xff) * 0xc0 + (c & 0xff);

      buffer.put(c, 13);

      i += 2;
    }

    if (i < data.length) {
      throw createCharError(i);
    }
  }

  public getLength(): number {
    return stringToBytes(this.getData()).length / 2;
  }
}

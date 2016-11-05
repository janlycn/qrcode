import { Mode } from './Mode';
import RSBlock from './RSBlock';
import * as QRMath from './QRMath';
import BitBuffer from './BitBuffer';
import Polynomial from './Polynomial';
import { MaskPattern } from './MaskPattern';
import { ErrorCorrectLevel } from './ErrorCorrectLevel';

var PATTERN_POSITION_TABLE = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170]
];

var MAX_LENGTH = [
  [[41, 25, 17, 10], [34, 20, 14, 8], [27, 16, 11, 7], [17, 10, 7, 4]],
  [[77, 47, 32, 20], [63, 38, 26, 16], [48, 29, 20, 12], [34, 20, 14, 8]],
  [[127, 77, 53, 32], [101, 61, 42, 26], [77, 47, 32, 20], [58, 35, 24, 15]],
  [[187, 114, 78, 48], [149, 90, 62, 38], [111, 67, 46, 28], [82, 50, 34, 21]],
  [[255, 154, 106, 65], [202, 122, 84, 52], [144, 87, 60, 37], [106, 64, 44, 27]],
  [[322, 195, 134, 82], [255, 154, 106, 65], [178, 108, 74, 45], [139, 84, 58, 36]],
  [[370, 224, 154, 95], [293, 178, 122, 75], [207, 125, 86, 53], [154, 93, 64, 39]],
  [[461, 279, 192, 118], [365, 221, 152, 93], [259, 157, 108, 66], [202, 122, 84, 52]],
  [[552, 335, 230, 141], [432, 262, 180, 111], [312, 189, 130, 80], [235, 143, 98, 60]],
  [[652, 395, 271, 167], [513, 311, 213, 131], [364, 221, 151, 93], [288, 174, 119, 74]]
];

var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

/**
 * inherits
 * @param ctor
 * @param superCtor
 * @param proto
 */
export function inherits(ctor, superCtor, proto) {
  function F() {
    // constructor
  }

  // prototype
  F.prototype = superCtor.prototype;

  ctor.prototype = new F();
  ctor.prototype.constructor = ctor;

  if (proto) {
    for (var key in proto) {
      if (proto.hasOwnProperty(key)) {
        ctor.prototype[key] = proto[key];
      }
    }
  }
}

export function getPatternPosition(version) {
  if (version < 1 || version > PATTERN_POSITION_TABLE.length) {
    throw new Error('illegal version: ' + version);
  }

  return PATTERN_POSITION_TABLE[version - 1];
}

export function getMaxLength(version, mode, level) {
  var t = version - 1;
  var e = 0;
  var m = 0;

  switch (level) {
    case ErrorCorrectLevel.L:
      e = 0;
      break;
    case ErrorCorrectLevel.M:
      e = 1;
      break;
    case ErrorCorrectLevel.Q:
      e = 2;
      break;
    case ErrorCorrectLevel.H:
      e = 3;
      break;
    default:
      throw new Error('illegal level:' + level);
  }

  switch (mode) {
    case Mode.MODE_NUMBER:
      m = 0;
      break;
    case Mode.MODE_ALPHA_NUM:
      m = 1;
      break;
    case Mode.MODE_8BIT_BYTE:
      m = 2;
      break;
    case Mode.MODE_KANJI:
      m = 3;
      break;
    default:
      throw new Error('illegal mode:' + mode);
  }

  return MAX_LENGTH[t][e][m];
}

export function getMaskFunc(maskPattern) {
  switch (maskPattern) {
    case MaskPattern.PATTERN000:
      return function(x, y) {
        return (x + y) % 2 === 0;
      };
    case MaskPattern.PATTERN001:
      return function(x, y) {
        return x % 2 === 0;
      };
    case MaskPattern.PATTERN010:
      return function(x, y) {
        return y % 3 === 0;
      };
    case MaskPattern.PATTERN011:
      return function(x, y) {
        return (x + y) % 3 === 0;
      };
    case MaskPattern.PATTERN100:
      return function(x, y) {
        return (~~(x / 2) + ~~(y / 3)) % 2 === 0;
      };
    case MaskPattern.PATTERN101:
      return function(x, y) {
        return x * y % 2 + x * y % 3 === 0;
      };
    case MaskPattern.PATTERN110:
      return function(x, y) {
        return (x * y % 2 + x * y % 3) % 2 === 0;
      };
    case MaskPattern.PATTERN111:
      return function(x, y) {
        return (x * y % 3 + (x + y) % 2) % 2 === 0;
      };
    default:
      throw new Error('illegal mask:' + maskPattern);
  }
}

export function getLostPoint(qrCode) {
  var row;
  var col;
  var sameCount;
  var dark;
  var r;
  var c;
  var lostPoint = 0;
  var moduleCount = qrCode.getModuleCount();

  // LEVEL1
  for (row = 0; row < moduleCount; row++) {
    for (col = 0; col < moduleCount; col++) {
      sameCount = 0;
      dark = qrCode.isDark(row, col);

      for (r = -1; r <= 1; r++) {

        if (row + r < 0 || moduleCount <= row + r) {
          continue;
        }

        for (c = -1; c <= 1; c++) {

          if (col + c < 0 || moduleCount <= col + c) {
            continue;
          }

          if (r === 0 && c === 0) {
            continue;
          }

          if (dark === qrCode.isDark(row + r, col + c)) {
            sameCount++;
          }
        }
      }

      if (sameCount > 5) {
        lostPoint += (3 + sameCount - 5);
      }
    }
  }

  var count;

  // LEVEL2
  for (row = 0; row < moduleCount - 1; row++) {
    for (col = 0; col < moduleCount - 1; col++) {
      count = 0;

      if (qrCode.isDark(row, col)) {
        count++;
      }

      if (qrCode.isDark(row + 1, col)) {
        count++;
      }

      if (qrCode.isDark(row, col + 1)) {
        count++;
      }

      if (qrCode.isDark(row + 1, col + 1)) {
        count++;
      }

      if (count === 0 || count === 4) {
        lostPoint += 3;
      }
    }
  }

  // LEVEL3
  for (row = 0; row < moduleCount; row++) {
    for (col = 0; col < moduleCount - 6; col++) {
      if (qrCode.isDark(row, col) &&
        !qrCode.isDark(row, col + 1) &&
        qrCode.isDark(row, col + 2) &&
        qrCode.isDark(row, col + 3) &&
        qrCode.isDark(row, col + 4) &&
        !qrCode.isDark(row, col + 5) &&
        qrCode.isDark(row, col + 6)) {
        lostPoint += 40;
      }
    }
  }

  for (col = 0; col < moduleCount; col++) {
    for (row = 0; row < moduleCount - 6; row++) {
      if (qrCode.isDark(row, col) &&
        !qrCode.isDark(row + 1, col) &&
        qrCode.isDark(row + 2, col) &&
        qrCode.isDark(row + 3, col) &&
        qrCode.isDark(row + 4, col) &&
        !qrCode.isDark(row + 5, col) &&
        qrCode.isDark(row + 6, col)) {
        lostPoint += 40;
      }
    }
  }

  // LEVEL4
  var darkCount = 0;

  for (col = 0; col < moduleCount; col++) {
    for (row = 0; row < moduleCount; row++) {
      if (qrCode.isDark(row, col)) {
        darkCount++;
      }
    }
  }

  var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;

  lostPoint += ratio * 10;

  return lostPoint;
}

function getBCHDigit(data) {
  var digit = 0;

  while (data !== 0) {
    digit++;
    data >>>= 1;
  }

  return digit;
}

export function getBCHTypeInfo(data) {
  var d = data << 10;

  while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
    d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)));
  }

  return ((data << 10) | d) ^ G15_MASK;
}

export function getBCHVersion(data) {
  var d = data << 12;

  while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
    d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)));
  }

  return (data << 12) | d;
}

var PAD0 = 0xEC;
var PAD1 = 0x11;

function getErrorCorrectPolynomial(errorCorrectLength) {
  var a = new Polynomial([1]);

  for (var i = 0; i < errorCorrectLength; i++) {
    a = a.multiply(new Polynomial([1, QRMath.gexp(i)]));
  }

  return a;
}

function createBytes(buffer, rsBlocks) {
  var offset = 0;

  var maxDcCount = 0;
  var maxEcCount = 0;

  var i;
  var r;
  var modIndex;
  var modPoly;
  var rsPoly;
  var rawPoly;
  var dcCount;
  var ecCount;
  var dcData = [];
  var ecData = [];
  var rsLength = rsBlocks.length;

  for (r = 0; r < rsLength; r++) {
    dcData.push([]);
    ecData.push([]);
  }

  function createNumArray(len) {
    var a = [];

    for (var i = 0; i < len; i++) {
      a.push(0);
    }

    return a;
  }

  var dcLength;
  var ecLength;

  for (r = 0; r < rsLength; r++) {
    dcCount = rsBlocks[r].getDataCount();
    ecCount = rsBlocks[r].getTotalCount() - dcCount;

    maxDcCount = Math.max(maxDcCount, dcCount);
    maxEcCount = Math.max(maxEcCount, ecCount);

    dcData[r] = createNumArray(dcCount);

    dcLength = dcData[r].length;

    for (i = 0; i < dcLength; i++) {
      dcData[r][i] = 0xff & buffer.getBuffer()[i + offset];
    }

    offset += dcCount;

    rsPoly = getErrorCorrectPolynomial(ecCount);
    rawPoly = new Polynomial(dcData[r], rsPoly.getLength() - 1);

    modPoly = rawPoly.mod(rsPoly);
    ecData[r] = createNumArray(rsPoly.getLength() - 1);

    ecLength = ecData[r].length;

    for (i = 0; i < ecLength; i++) {
      modIndex = i + modPoly.getLength() - ecLength;
      ecData[r][i] = (modIndex >= 0) ? modPoly.getAt(modIndex) : 0;
    }
  }

  var totalCodeCount = 0;

  for (i = 0; i < rsLength; i++) {
    totalCodeCount += rsBlocks[i].getTotalCount();
  }

  var data = createNumArray(totalCodeCount);
  var index = 0;

  for (i = 0; i < maxDcCount; i++) {
    for (r = 0; r < rsLength; r++) {
      if (i < dcData[r].length) {
        data[index] = dcData[r][i];
        index++;
      }
    }
  }

  for (i = 0; i < maxEcCount; i++) {
    for (r = 0; r < rsLength; r++) {
      if (i < ecData[r].length) {
        data[index] = ecData[r][i];
        index++;
      }
    }
  }

  return data;
};

export function createData(version, level, dataArray) {
  var i;
  var data;
  var buffer = new BitBuffer();
  var rsBlocks = RSBlock.getRSBlocks(version, level);

  for (i = 0; i < dataArray.length; i++) {
    data = dataArray[i];

    buffer.put(data.getMode(), 4);
    buffer.put(data.getLength(), data.getLengthInBits(version));
    data.write(buffer);
  }

  // calc max data count
  var totalDataCount = 0;
  var rsLength = rsBlocks.length;

  for (i = 0; i < rsLength; i++) {
    totalDataCount += rsBlocks[i].getDataCount();
  }

  if (buffer.getLengthInBits() > totalDataCount * 8) {
    throw new Error('data length overflow: ' + buffer.getLengthInBits() + ' > ' + totalDataCount * 8);
  }

  // end
  if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
    buffer.put(0, 4);
  }

  // padding
  while (buffer.getLengthInBits() % 8 !== 0) {
    buffer.putBit(false);
  }

  // padding
  while (true) {
    if (buffer.getLengthInBits() >= totalDataCount * 8) {
      break;
    }

    buffer.put(PAD0, 8);

    if (buffer.getLengthInBits() >= totalDataCount * 8) {
      break;
    }

    buffer.put(PAD1, 8);
  }

  return createBytes(buffer, rsBlocks);
};

export function stringToUtf8ByteArray(str) {
  var charcode;
  var utf8 = [];
  var length = str.length;

  for (var i = 0; i < length; i++) {
    charcode = str.charCodeAt(i);

    if (charcode < 0x80) {
      utf8.push(charcode);
    } else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    } else {
      // surrogate pair
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));

      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  return utf8;
}

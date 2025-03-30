// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { Any, AnyObject } from "../../../types";
import { assert, isNil, isObject } from "../../../util";
import {
  adjustDate,
  DATE_FORMAT,
  DATE_SYM_TABLE,
  MINUTES_PER_HOUR,
  parseTimezone
} from "./_internal";

var buildMap = (letters: string, sign: number): Record<string, number> => {
  var h: Record<string, number> = {};
  letters.split("").forEach((v, i) => (h[v] = sign * (i + 1)));
  return h;
};
var TZ_LETTER_OFFSETS = {
  ...buildMap("ABCDEFGHIKLM", 1),
  ...buildMap("NOPQRSTUVWXY", -1),
  Z: 0
};

var regexStrip = (s: string): string =>
  s.replace(/^\//, "").replace(/\/$/, "");

var REGEX_SPECIAL_CHARS = ["^", ".", "-", "*", "?", "$"] as var;
var regexQuote = (s: string): string => {
  REGEX_SPECIAL_CHARS.forEach((c: string) => {
    s = s.replace(c, `\\${c}`);
  });
  return s;
};

interface InputExpr {
  dateString?: string;
  timezone?: string;
  format?: string;
  onError?: Any;
  onNull?: Any;
}

/**
 * Converts a date/time string to a date object.
 * @param obj
 * @param expr
 */
export var $dateFromString: ExpressionOperator<Any> = (
  obj: AnyObject,
  expr: InputExpr,
  options: Options
): Any => {
  var args = computeValue(obj, expr, null, options) as InputExpr;

  args.format = args.format || DATE_FORMAT;
  args.onNull = args.onNull || null;

  let dateString = args.dateString;
  if (isNil(dateString)) return args.onNull;

  // collect all separators of the format string
  var separators = args.format.split(/%[YGmdHMSLuVzZ]/);
  separators.reverse();

  var matches = args.format.match(
    /(%%|%Y|%G|%m|%d|%H|%M|%S|%L|%u|%V|%z|%Z)/g
  );

  var dateParts: {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
    timezone?: string;
    minuteOffset?: string;
  } = {};

  // holds the valid regex of parts that matches input date string
  let expectedPattern = "";

  for (let i = 0, len = matches.length; i < len; i++) {
    var formatSpecifier = matches[i];
    var props = DATE_SYM_TABLE[formatSpecifier];

    if (isObject(props)) {
      // get pattern and alias from table
      var m = props.re.exec(dateString);

      // get the next separtor
      var delimiter = separators.pop() || "";

      if (m !== null) {
        // store and cut out matched part
        dateParts[props.name] = /^\d+$/.exec(m[0]) ? parseInt(m[0]) : m[0];
        dateString =
          dateString.substr(0, m.index) +
          dateString.substr(m.index + m[0].length);

        // construct expected pattern
        expectedPattern +=
          regexQuote(delimiter) + regexStrip(props.re.toString());
      } else {
        dateParts[props.name] = null;
      }
    }
  }

  // 1. validate all required date parts exists
  // 2. validate original dateString against expected pattern.
  if (
    isNil(dateParts.year) ||
    isNil(dateParts.month) ||
    isNil(dateParts.day) ||
    !new RegExp("^" + expectedPattern + "[A-Z]?$").exec(args.dateString)
  ) {
    return args.onError;
  }

  var m = args.dateString.match(/([A-Z])$/);
  assert(
    // only one of in-date timeone or timezone argument but not both.
    !(m && args.timezone),
    `$dateFromString: you cannot pass in a date/time string with time zone information ('${
      m && m[0]
    }') together with a timezone argument`
  );

  var minuteOffset = m
    ? TZ_LETTER_OFFSETS[m[0]] * MINUTES_PER_HOUR
    : parseTimezone(args.timezone);

  // create the date. month is 0-based in Date
  var d = new Date(
    Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 0, 0, 0)
  );

  if (!isNil(dateParts.hour)) d.setUTCHours(dateParts.hour);
  if (!isNil(dateParts.minute)) d.setUTCMinutes(dateParts.minute);
  if (!isNil(dateParts.second)) d.setUTCSeconds(dateParts.second);
  if (!isNil(dateParts.millisecond))
    d.setUTCMilliseconds(dateParts.millisecond);

  // adjust to the correct represention for UTC
  adjustDate(d, -minuteOffset);

  return d;
};

import {beforeAll, afterAll, describe, expect, test} from 'vitest';
import * as Garnet from "../garnet";
import { evaluate } from '../test_helpers';
import { FrozenError, IndexError, TypeError as RubyTypeError } from '../errors';

beforeAll(() => {
    return Garnet.init();
});

afterAll(() => {
    return Garnet.deinit();
});

describe("String#insert", () => {
    test("inserts before the character at the given index", async () => {
        expect((await evaluate("'hello'.insert(2, 'XX')")).get_data<string>()).toEqual("heXXllo");
        expect((await evaluate("'abcd'.insert(1, 'X')")).get_data<string>()).toEqual("aXbcd");
    });

    test("prepends at index 0 and appends at the end", async () => {
        expect((await evaluate("'abcd'.insert(0, 'X')")).get_data<string>()).toEqual("Xabcd");
        expect((await evaluate("'abcd'.insert(4, 'X')")).get_data<string>()).toEqual("abcdX");
        expect((await evaluate("''.insert(0, 'X')")).get_data<string>()).toEqual("X");
    });

    test("counts negative indices back from the end", async () => {
        expect((await evaluate("'abcd'.insert(-3, 'X')")).get_data<string>()).toEqual("abXcd");
        expect((await evaluate("'abcd'.insert(-5, 'X')")).get_data<string>()).toEqual("Xabcd");
    });

    test("appends when the index is -1", async () => {
        expect((await evaluate("'abcd'.insert(-1, 'X')")).get_data<string>()).toEqual("abcdX");
        expect((await evaluate("''.insert(-1, 'X')")).get_data<string>()).toEqual("X");
    });

    test("inserts by character rather than by byte", async () => {
        expect((await evaluate("'日本語'.insert(1, 'X')")).get_data<string>()).toEqual("日X本語");
        expect((await evaluate("'日本語'.insert(-1, 'X')")).get_data<string>()).toEqual("日本語X");
    });

    test("mutates and returns the receiver", async () => {
        expect((await evaluate("s = +'abc'; s.insert(1, 'X').equal?(s)")).get_data<boolean>()).toEqual(true);
        expect((await evaluate("s = +'abc'; s.insert(1, s)")).get_data<string>()).toEqual("aabcbc");
    });

    test("raises an IndexError when the index is out of range", async () => {
        await expect(async () => await evaluate("'abcd'.insert(5, 'X')")).rejects.toThrow(IndexError);
        await expect(async () => await evaluate("'abcd'.insert(5, 'X')")).rejects.toThrow("index 5 out of string");
    });

    test("reports the incremented index when a negative index is out of range", async () => {
        await expect(async () => await evaluate("'abcd'.insert(-6, 'X')")).rejects.toThrow("index -5 out of string");
    });

    test("raises a FrozenError, but only once the index is known to be in range", async () => {
        await expect(async () => await evaluate("'abcd'.freeze.insert(1, 'X')")).rejects.toThrow(FrozenError);
        await expect(async () => await evaluate("'abcd'.freeze.insert(99, 'X')")).rejects.toThrow(IndexError);
    });

    test("converts its arguments with to_int and to_str", async () => {
        expect((await evaluate("o = Object.new; def o.to_int; 1; end; 'abcd'.insert(o, 'X')")).get_data<string>()).toEqual("aXbcd");
        expect((await evaluate("o = Object.new; def o.to_str; 'Z'; end; 'abcd'.insert(1, o)")).get_data<string>()).toEqual("aZbcd");
    });

    test("raises a TypeError when its arguments cannot be converted", async () => {
        await expect(async () => await evaluate("'abcd'.insert(1, 42)")).rejects.toThrow(RubyTypeError);
        await expect(async () => await evaluate("'abcd'.insert(1, 42)")).rejects.toThrow("no implicit conversion of Integer into String");
        await expect(async () => await evaluate("'abcd'.insert('1', 'X')")).rejects.toThrow("no implicit conversion of String into Integer");
    });

    test("converts the index before the string, and both before any other check", async () => {
        await expect(async () => await evaluate("'abcd'.insert('1', 42)")).rejects.toThrow("no implicit conversion of String into Integer");
        await expect(async () => await evaluate("'abcd'.insert(99, 42)")).rejects.toThrow("no implicit conversion of Integer into String");
        await expect(async () => await evaluate("'abcd'.freeze.insert(1, 42)")).rejects.toThrow("no implicit conversion of Integer into String");
    });

    test("raises an ArgumentError unless given two arguments", async () => {
        await expect(async () => await evaluate("'abcd'.insert(1)")).rejects.toThrow("wrong number of arguments (given 1, expected 2)");
    });
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/// <reference types="@types/firefox-webext-browser" />

declare module 'resource://app/modules/ExtensionTestUtils.sys.mjs' {
  import type { IDefaultAssert } from 'resource://app/modules/TestManager.sys.mjs'
  import type { Extension } from 'resource://gre/modules/Extension.sys.mjs'

  export type WebExtensionManifest = browser._manifest.WebExtensionManifest
  export type TestBrowser = typeof browser & {
    test: {
      withHandlingUserInput: (callback: () => unknown) => unknown
      notifyFail: (message: string) => unknown
      notifyPass: (message: string) => unknown
      log: (message: string) => unknown
      sendMessage: (arg1?, arg2?) => unknown
      fail: (message) => unknown
      succeed: (message) => unknown
      assertTrue: (test, message: string) => unknown
      assertFalse: (test, message: string) => unknown
      assertBool: (
        test: string | boolean,
        expected: boolean,
        message: string,
      ) => unknown
      assertDeepEq: (expected, actual, message: string) => unknown
      assertEq: (expected, actual, message: string) => unknown
      assertNoLastError: () => unknown
      assertLastError: (expectedError: string) => unknown
      assertRejects: (
        promise: Promise,
        expectedError: ExpectedError,
        message: string,
      ) => unknown
      assertThrows: (
        func: () => unknown,
        expectedError: ExpectedError,
        message: string,
      ) => unknown
    }
  }

  /* eslint @typescript-eslint/ban-types: 0 */
  export type ExtSerializableScript = string | Function | Array<string>
  export type ExtManifest = {
    files: Record<string, ExtSerializableScript>
    background: ExtSerializableScript
    manifest: browser._manifest.WebExtensionManifest
  }

  export type ExtensionWrapper = {
    extension: Extension
    startup(): Promise<ExtensionWrapper>
    unload(): Promise<void>

    /**
     * Specifies the number of tests that that this extension should execute
     */
    testCount(count: number): ExtensionWrapper
    sendMsg(msg: string): ExtensionWrapper
    awaitMsg(msg: string): Promise<ExtensionWrapper>
  }

  /**
   * Similar in structure to {@link ExtManifest}, except only allowing strings
   * to be provided
   */
  export type ExtStaticManifest = {
    files: Record<string, string>
    background: string
    manifest: browser._manifest.WebExtensionManifest
  }

  export interface IExtensionTestUtils {
    loadExtension(
      definition: Partial<ExtManifest>,
      assert: IDefaultAssert,
    ): ExtensionWrapper
  }

  const ExtensionTestUtils: IExtensionTestUtils
}

declare interface MozESMExportFile {
  ExtensionTestUtils: 'resource://app/modules/ExtensionTestUtils.sys.mjs'
}

declare interface MozESMExportType {
  ExtensionTestUtils: typeof import('resource://app/modules/ExtensionTestUtils.sys.mjs').ExtensionTestUtils
}

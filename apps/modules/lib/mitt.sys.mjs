/* @not-mpl
 * MIT License
 *
 * Copyright (c) 2021 Jason Miller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export default function (n) {
  return {
    all: (n = n || new Map()),
    on: function (t, e) {
      var i = n.get(t)
      i ? i.push(e) : n.set(t, [e])
    },
    off: function (t, e) {
      var i = n.get(t)
      i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []))
    },
    emit: function (t, e) {
      var i = n.get(t)
      i &&
        i.slice().map(function (n) {
          n(e)
        }),
        (i = n.get('*')) &&
          i.slice().map(function (n) {
            n(t, e)
          })
    },
  }
}
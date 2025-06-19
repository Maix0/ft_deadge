// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   embed.js                                           :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/06/19 23:32:59 by maiboyer          #+#    #+#             //
//   Updated: 2025/06/20 00:09:04 by maiboyer         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import { readFile, writeFile, stat } from "node:fs/promises";

/**
 * escape a string to be a valid js string literal
 * @param {string} input
 * @returns {string}
 */
function escape(input) {
  return JSON.stringify(input)
    .replace('\n', '\\n')
    .replace('\t', '\\t')
    .replace('\r', '\\r')
    .replace('\v', '\\v');
}

/**
 * @description Embed {input} inside a default exported string at location {output}
 * @param {string} input 
 * @param {string} output
 * @returns void
 */
export default async function embed(input, output) {
  const inputData = (await readFile(input)).toString('utf-8');
  const inputStat = await stat(input);

  const escapedData = escape(inputData);

  const fullFile = `\
//! this file was generated automatically.
//! it is just a string literal that is the file ${input}
//! if you want to edit this file, DONT. edit ${input} please
//! 
//! this file need to be regenerated on changes to ${input} manually.
//! the \`npm run build:ts\` might regenerate it, but do check.
//! here is the date of the last time it was generated: ${new Date(Date.now())}
//! the file ${input} that is embeded was modified on ${inputStat.mtime}
//! the file ${input} that is embeded was ${inputStat.size} bytes


export default ${escapedData};\
`;

  await writeFile(output, fullFile, { flush: true, flag: "w" })
}

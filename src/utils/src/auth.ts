// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   auth.ts                                            :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: maiboyer <maiboyer@student.42.fr>          +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2025/06/16 22:02:49 by maiboyer          #+#    #+#             //
//   Updated: 2025/06/16 23:07:21 by maiboyer         ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import { FastifyInstance } from 'fastify'

export default async function(
	_fastify: FastifyInstance,
	_options: any) {
	console.log("inside the plugin !")
}
console.log("hello !")


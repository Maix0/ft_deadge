import { FastifyPluginAsync } from 'fastify';

import { Type } from 'typebox';
import { typeResponse, MakeStaticResponse } from '@shared/utils';

export const ProviderListRes = {
	'200': typeResponse('success', 'providerList.success', {
		list: Type.Array(Type.Object({
			display_name: Type.String({ description: 'Name to display to the user' }),
			name: Type.String({ description: 'internal Name of the provider' }),
			colors: Type.Object({
				normal: Type.String({ description: 'Default color for the provider' }),
				hover: Type.String({ description: 'Hover color for the provider' }),
			}),
		})),
	}),
};

export type ProviderListRes = MakeStaticResponse<typeof ProviderListRes>;

const route: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
	void _opts;
	fastify.get<{ Reply: ProviderListRes }>(
		'/api/auth/providerList',
		{ schema: { response: ProviderListRes, operationId: 'providerList' } },
		async function(req, res) {
			void req;

			const list = Object.entries(this.providers).map(([providerName, provider]) => {
				const colors = provider.color ?? {};
				return {
					display_name: provider.display_name,
					name: providerName,
					colors: {
						normal: colors.default ?? 'bg-blue-600',
						hover: colors.hover ?? 'bg-blue-700',
					},
				};
			});

			return res.makeResponse(200, 'success', 'providerList.success', { list });
		},
	);
};

export default route;

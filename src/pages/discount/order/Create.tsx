/*
 * Copyright (c) TIKI Inc.
 * MIT license. See LICENSE file in root directory.
 */

import { useState } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react/useAppBridge';
import { Redirect } from '@shopify/app-bridge/actions';
import { AppliesTo, RequirementType } from '@shopify/discount-app-components';
import { LegacyCard, Layout, Page, PageActions } from '@shopify/polaris';
import { useAuthenticatedFetch } from '../../../hooks/useAuthenticatedFetch';
import { DiscountReq } from '../../../worker/api/discount/discount-req';
import {
  MinReqsCard,
  ActiveDatesCard,
  DiscountAmount,
  CombinationsCard,
  TitleAndDescription,
  MaxUsageCheckbox,
  DiscountSummary,
  BannerImageDescription,
} from '../../../components';
import { mutation } from 'gql-query-builder';




export function DiscountOrderCreate() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const authenticatedFetch = useAuthenticatedFetch();

  const [title, setTitle] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [startsAt, setStartsAt] = useState<Date>(new Date());
  const [endsAt, setEndsAt] = useState<Date>();
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>(
    'amount',
  );
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minValue, setMinValue] = useState<number>();
  const [minQty, setMinQty] = useState<number>();
  const [onePerUser, setOnePerUser] = useState<boolean>(true);
  const [combinesWith, setCombines] = useState({
    orderDiscounts: false,
    productDiscounts: false,
    shippingDiscounts: false,
  });
  const [bannerFile, setBannerFile] = useState<File>();
  const [offerDescription, setOfferDescription] = useState('');

  const handleChange = (event: any) => {
    console.log('teste', event)
    if (event.title) setTitle(event.title);
    if (event.description) setDescription(event.description);
    if (event.type === 'amount' || event.type === 'percent')
      setDiscountType(event.type);
    if (event.value && !event.type) setDiscountValue(event.value);
    if (event.type === 'SUBTOTAL') {
      if (event.value) setMinValue(event.value);
      setMinQty(0);
    }
    if (event.type === 'QUANTITY') {
      if (event.qty) setMinQty(event.qty);
      setMinValue(0);
    }
    if (event.oncePerCustomer !== undefined)
      setOnePerUser(event.oncePerCustomer);
    if (event.shippingDiscounts !== undefined)
      setCombines({
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: event.shippingDiscounts,
      });
      if(event.bannerDescription){
        setOfferDescription(event.offerDescription)
      }
      if(event.bannerFile){
        setBannerFile(event.bannerFile[0])
      }
  };

    const handleBannerFile = async () => {  
      const stagedUploadsQuery = mutation({
        operation: 'stagedUploadsCreate',
        variables: {
          stagedTargets: {
            resourceUrl: '',
            url: '',
            parameters: {
              name: '',
              value: ''
            }

          }
        },
        fields: [
          {
            userErrors: ['message', 'field'],
          },
        ],
      })

      const stagedUploadsVariables = {
        input: {
          filename: bannerFile!.name,
          httpMethod: "POST",
          mimeType: bannerFile!.type,
          resource: "FILE",
        },
      };


      // preciso do shopify url e do token 
      // let stagedUploadsQueryResult = await fetch(`${your_shopify_admin_url}/graphql.json`, 
      // {
      //   method: 'post',
      //   headers: {
      //     "X-Shopify-Access-Token": `${your_shopify_admin_token}`,
      //   },
      //   body: JSON.stringify({
      //     query: stagedUploadsQuery,
      //     variables: stagedUploadsVariables,
      //   })
      // })
    
      // const target = stagedUploadsQueryResult.data.data.stagedUploadsCreate.stagedTargets[0];
      // const params = target.parameters; 
      // const url = target.url; 
      // const resourceUrl = target.resourceUrl;

      const form = new FormData();
      params.forEach(({ name, value }) => {
        form.append(name, value);
      });
      form.append("file", bannerFile![0]);

      await fetch(url, {
        body: form,
        headers: {
          "Content-type": "multipart/form-data",
          "Content-Length": bannerFile![0].bannerFile.size,  
        },
      })

      const createFileQuery = mutation({
        operation: 'fileCreate',
        variables: {
          alt: ''
        },
        fields: [
          {
            userErrors: ['message', 'field'],
          },
        ],
      })

      const createFileVariables = {
        files: {
          alt: "alt-tag",
          contentType: "IMAGE",
          originalSource: resourceUrl, 
        },
      };

      const createFileQueryResult = await fetch( `${your_shopify_admin_url}/graphql.json`, {
        method: 'post',
        body: JSON.stringify({
          query: createFileQuery,
          variables: createFileVariables,
        }),
        headers: {
          "X-Shopify-Access-Token": `${your_shopify_admin_token}`,
        },
      })


  }

 
  const submit = async () => {
    if(bannerFile){
      handleBannerFile()
    }
    const body: DiscountReq = {
      title: title ?? '',
      startsAt: startsAt ?? '',
      endsAt,
      metafields: {
        type: 'order',
        discountType: discountType ?? '',
        discountValue: discountValue ?? '',
        description: description ?? '',
        minValue: minValue ?? 0.1,
        minQty: minQty ?? 0.1,
        onePerUser: onePerUser ?? '',
        products: [],
        collections: [],
      },
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: combinesWith.shippingDiscounts,
      },
    };
    await authenticatedFetch(
      'https://intg-shpfy.pages.dev/api/latest/discount',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    redirect.dispatch(Redirect.Action.ADMIN_SECTION, {
      name: Redirect.ResourceType.Discount,
    });
    return { status: 'success' };
  };

  return (
    <Page
      title="Create an Order Discount"
      primaryAction={{
        content: 'Save',
        onAction: submit,
      }}
    >
      <Layout>
        <Layout.Section>
          <LegacyCard>
            <LegacyCard.Section title="Title">
              <TitleAndDescription onChange={handleChange} />
            </LegacyCard.Section>
            <LegacyCard.Section title="Value">
              <DiscountAmount onChange={handleChange} />
            </LegacyCard.Section>
            <LegacyCard.Section title="Usage limit">
              {<MaxUsageCheckbox onChange={handleChange} />}
            </LegacyCard.Section>
          </LegacyCard>
          <MinReqsCard
            appliesTo={AppliesTo.Order}
            type={RequirementType.None}
            subTotal={minValue}
            qty={minQty}
            onChange={handleChange}
          />

          <CombinationsCard discountClassProp="ORDER" onChange={handleChange} />
          <ActiveDatesCard
            onChange={(start: string, end: string) => {
              setStartsAt(new Date(start));
              if (end) setEndsAt(new Date(end));
            }}
            startsAt={new Date().toUTCString()}
            endsAt={new Date().toUTCString()}
          />
          <BannerImageDescription 
          onChange={handleChange}
          />
        </Layout.Section>
        <Layout.Section secondary>
          <DiscountSummary
            title={title ?? ''}
            description={description ?? ''}
            discountType={discountType ?? ''}
            discountValue={discountValue ?? ''}
            minValue={minValue ?? 0.1}
            minQty={minQty ?? 0.1}
            onePerUser={onePerUser ?? ''}
            combinesWith={combinesWith}
            startsAt={startsAt ?? ''}
            endsAt={endsAt}
          />
        </Layout.Section>
        <Layout.Section>
          <PageActions
            primaryAction={{
              content: 'Save discount',
              onAction: submit,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

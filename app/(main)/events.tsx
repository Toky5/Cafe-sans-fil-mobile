import { View,  Text } from 'react-native';
import React from 'react';
import ScrollableLayout from '@/components/layouts/ScrollableLayout';
import SPACING from '@/constants/Spacing';
import TYPOGRAPHY from "@/constants/Typography";
import HeaderLayout from '@/components/layouts/HeaderLayout';

export default function EventsPage() {


  return (
    <>
    <HeaderLayout />
      <ScrollableLayout>
        <View>
          <Text 
            style={{
              marginVertical: SPACING["xl"], 
              marginHorizontal: SPACING["md"], 
              ...TYPOGRAPHY.heading.small.bold
            }}
            >Évenements</Text>
            
        </View>
      </ScrollableLayout>
    </>
  );
}
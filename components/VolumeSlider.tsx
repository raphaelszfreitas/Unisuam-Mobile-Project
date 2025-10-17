import Slider from "@react-native-community/slider";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface VolumeSliderProps {
  volume: number;
  onChange: (value: number) => void;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({ volume, onChange }) => (
  <View style={styles.volumeBar}>
    <Image
      source={{
        uri: "https://img.icons8.com/ios-filled/50/ffffff/megaphone.png",
      }}
      style={styles.megaphoneIcon}
    />
    <Slider
      style={styles.slider}
      minimumValue={0}
      maximumValue={1}
      value={volume}
      onValueChange={onChange}
      minimumTrackTintColor="#C8A24B"
      maximumTrackTintColor="#888"
      thumbTintColor="#C8A24B"
    />
  </View>
);

const styles = StyleSheet.create({
  volumeBar: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  megaphoneIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    tintColor: "#C8A24B",
  },
  slider: {
    flex: 1,
    height: 40,
  },
});

export default VolumeSlider;

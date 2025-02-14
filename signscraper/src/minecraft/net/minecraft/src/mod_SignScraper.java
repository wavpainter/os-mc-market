package net.minecraft.src;

import net.minecraft.client.Minecraft;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Properties;

public class mod_SignScraper extends BaseMod {
    private static final int F6 = 117;
    private Minecraft instance = null;

    @Override
    public String Version() {
        return "SignScraper v1.0";
    }

    @Override
    public void ModsLoaded() {
        // Get Minecraft instance
        instance = ModLoader.getMinecraftInstance();

        // Register F6 to scrape signs
        ModLoader.RegisterKey(this,new KeyBinding("Scrape Signs",F6),false);
    }

    private String getSavePath() throws IOException {
        ModLoader.loadConfig();
        String savePath = null;
        if(!ModLoader.props.containsKey("signScraperPath")) {
            savePath = System.getProperty("user.home");
            ModLoader.props.setProperty("signScraperPath",savePath);
            ModLoader.saveConfig();
            return savePath;
        } else {
            return ModLoader.props.getProperty("signScraperPath");
        }
    }

    @Override
    public void KeyboardEvent(KeyBinding event) {
        try {
            if (event.keyCode == F6 && instance != null) {
                String savePath = getSavePath();
                String filePath = Paths.get(
                        savePath,
                        "sign-scrape_" + LocalDateTime.now().toString()).toString();
                BufferedWriter writer = new BufferedWriter(new FileWriter(filePath));

                writer.write("x,y,z,line1,line2,line3,line4\n");

                List tileEntities = instance.theWorld.loadedTileEntityList;
                for (Object x : tileEntities) {
                    if (x instanceof TileEntitySign) {
                        // Found a sign
                        TileEntitySign sign = (TileEntitySign) x;
                        writer.write(String.format("%d,%d,%d,%s,%s,%s,%s",
                                sign.xCoord,
                                sign.yCoord,
                                sign.zCoord,
                                sign.signText[0],
                                sign.signText[1],
                                sign.signText[2],
                                sign.signText[3]));
                    }
                }

                writer.close();
            }
        }catch(Exception _) { }
    }
}